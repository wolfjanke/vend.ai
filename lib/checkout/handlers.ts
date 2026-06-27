import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { logServerError } from '@/lib/logger'
import { checkoutPaymentSchema } from '@/lib/validations'
import { calculateInstallmentQuote } from '@/lib/payments/installment-fees'
import { createCheckoutPayment } from '@/lib/asaas/payments'
import { AsaasApiError } from '@/lib/asaas/client'
import { getPayment } from '@/lib/payments/wolf-hub'
import type { PlanSlug } from '@/types'
import { resolveOrderLines, amountsMatch, OrderValidationError } from '@/lib/order-pricing'
import { orderReject422, validationErrorResponse } from '@/lib/api-errors'
import { signCheckoutStatusToken, verifyCheckoutStatusToken } from '@/lib/checkout-status-token'
import { getCheckoutRates } from '@/lib/checkout-rates'
import { encryptCpf } from '@/lib/crypto/pii'
import { checkCheckoutStatusRateLimit } from '@/lib/public-rate-limit'
import { isCheckoutEnabledForStore } from '@/lib/checkout-enabled'
import { resolveCheckoutChannelsFromStore } from '@/lib/checkout-availability'
import { calculateCheckoutMarketingPricing } from '@/lib/checkout/marketing-pricing'
import type { StoreSettings } from '@/types'

const ASAAS_CONFIRMED = new Set(['CONFIRMED', 'RECEIVED'])

function mapAsaasStatus(status: string): 'PENDING' | 'CONFIRMED' | 'FAILED' {
  if (ASAAS_CONFIRMED.has(status)) return 'CONFIRMED'
  if (status === 'REFUNDED' || status === 'DELETED') return 'FAILED'
  return 'PENDING'
}

export async function handleCheckoutCreate(storeSlug: string, body: unknown) {
  const parsed = checkoutPaymentSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message
    return validationErrorResponse(first)
  }

  const {
    billingType,
    installments,
    grossValue: clientGrossValue,
    payableValue: clientPayableValue,
    couponCode,
    creditCardToken,
    customer,
    cartItems,
    interestBearer,
  } = parsed.data

  const storeRows = await sql`
    SELECT
      id, slug, plan, settings_json,
      asaas_wallet_id,
      asaas_onboarding_status,
      is_demo,
      checkout_mode
    FROM stores
    WHERE slug = ${storeSlug}
    LIMIT 1
  `

  const store = storeRows[0] as {
    id: string
    slug: string
    plan: string | null
    settings_json: StoreSettings | null
    asaas_wallet_id: string | null
    asaas_onboarding_status: string | null
    is_demo: boolean | null
    checkout_mode: string | null
  } | undefined

  if (!store) {
    return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })
  }

  const storeInput = {
    plan:                    store.plan ?? 'free',
    asaas_onboarding_status: store.asaas_onboarding_status,
    asaas_wallet_id:         store.asaas_wallet_id,
    is_demo:                 store.is_demo,
    checkout_mode:           store.checkout_mode,
  }

  if (!isCheckoutEnabledForStore(storeInput)) {
    return NextResponse.json(
      { error: 'Checkout integrado indisponível para esta loja.' },
      { status: 503 },
    )
  }

  const { siteEnabled } = resolveCheckoutChannelsFromStore(storeInput)
  if (!siteEnabled) {
    return NextResponse.json(
      { error: 'Checkout desativado nas configurações da loja.' },
      { status: 403 },
    )
  }

  let lines
  try {
    lines = await resolveOrderLines(store.id, cartItems)
  } catch (e) {
    if (e instanceof OrderValidationError) return orderReject422()
    throw e
  }

  const serverGrossValue = Number(
    lines.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2),
  )

  if (!amountsMatch(serverGrossValue, clientGrossValue)) {
    return orderReject422()
  }

  const settings = (store.settings_json as StoreSettings | null) ?? {}
  const pricing = calculateCheckoutMarketingPricing({
    items:       lines,
    billingType,
    couponCode,
    settings,
  })

  if (!amountsMatch(pricing.subtotal, serverGrossValue)) {
    return orderReject422()
  }

  if (!amountsMatch(pricing.totalFinal, clientPayableValue)) {
    return orderReject422()
  }

  const payableBase = pricing.totalFinal

  const plan = (store.plan ?? 'free') as PlanSlug
  const rates = await getCheckoutRates()

  let quote
  try {
    quote = calculateInstallmentQuote(payableBase, installments, plan, rates, { interestBearer })
  } catch {
    return orderReject422()
  }

  const asaasItems = lines.map(i => ({
    description: `${i.qty}x ${i.name} (${i.color} ${i.size})`,
    quantity:    i.qty,
    value:       i.price,
  }))

  let paymentResult
  try {
    paymentResult = await createCheckoutPayment(
      { ...store, asaas_wallet_id: store.asaas_wallet_id } as Parameters<typeof createCheckoutPayment>[0],
      quote,
      billingType,
      {
        name: customer.name,
        cpfCnpj: customer.cpfCnpj,
        email: customer.email,
        mobilePhone: customer.mobilePhone,
      },
      asaasItems,
      creditCardToken,
    )
  } catch (err) {
    if (err instanceof AsaasApiError) {
      logServerError('[checkout/create] AsaasApiError', { code: err.code, status: err.status })
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Erro ao processar pagamento.' }, { status: 502 })
      }
      return NextResponse.json({ error: err.description, code: err.code }, { status: 502 })
    }
    logServerError('[checkout/create] createCheckoutPayment', err)
    return NextResponse.json({ error: 'Erro ao criar cobrança' }, { status: 500 })
  }

  let customerCpfEnc: string | null = null
  try {
    customerCpfEnc = await encryptCpf(customer.cpfCnpj)
  } catch (err) {
    logServerError('[checkout/create] encryptCpf', err)
    return NextResponse.json({ error: 'Erro ao processar dados do cliente' }, { status: 500 })
  }

  const countRows = await sql`SELECT COUNT(*)::int as c FROM orders WHERE store_id = ${store.id}`
  const orderSeq  = (Number(countRows[0]?.c ?? 0) + 1).toString().padStart(4, '0')
  const orderNumber = `CHK-${orderSeq}`

  const paymentMethod = billingType === 'PIX' ? 'PIX' : 'CARTAO'

  const itemsJson = JSON.stringify(lines.map(i => ({
    product_id: i.product_id,
    variant_id: i.variant_id,
    name:       i.name,
    size:       i.size,
    color:      i.color,
    qty:        i.qty,
    price:      i.price,
    photo:      i.photo,
  })))

  try {
    await sql`
      INSERT INTO orders (
        store_id,
        order_number,
        customer_name,
        customer_whatsapp,
        customer_email,
        customer_cpf_enc,
        items_json,
        total,
        subtotal,
        discount_pix,
        discount_coupon,
        discount_total,
        total_final,
        coupon_code_applied,
        notes,
        status,
        payment_method,
        payment_source,
        payment_status,
        asaas_payment_id,
        checkout_gross_value,
        checkout_installment_count,
        checkout_installment_value,
        platform_fee_pct,
        platform_fee_amount,
        platform_fee_fixed,
        net_value,
        checkout_url,
        pix_qr_code,
        pix_copy_paste,
        privacy_consent_at
      ) VALUES (
        ${store.id},
        ${orderNumber},
        ${customer.name},
        ${customer.mobilePhone},
        ${customer.email},
        ${customerCpfEnc},
        ${itemsJson}::jsonb,
        ${quote.totalComJuros},
        ${pricing.subtotal},
        ${pricing.discountPix},
        ${pricing.discountCoupon},
        ${pricing.discountTotal},
        ${payableBase},
        ${pricing.couponCodeApplied},
        '',
        'NOVO',
        ${paymentMethod},
        'CHECKOUT',
        'PENDING',
        ${paymentResult.asaas_payment_id},
        ${serverGrossValue},
        ${installments},
        ${quote.installmentValue},
        ${quote.faixaTaxa},
        ${quote.platformFeeAmount},
        ${quote.platformFeeFixed},
        ${quote.netValue},
        ${paymentResult.invoiceUrl},
        ${paymentResult.pixQrCode ?? null},
        ${paymentResult.pixCopiaECola ?? null},
        NOW()
      )
    `
  } catch (err) {
    logServerError('[checkout/create] INSERT order — pagamento órfão no Asaas', {
      paymentId: paymentResult.asaas_payment_id,
      err,
    })
    return NextResponse.json({ error: 'Erro ao registrar pedido' }, { status: 500 })
  }

  const statusToken = signCheckoutStatusToken(paymentResult.asaas_payment_id)

  const cardConfirmed =
    billingType === 'CREDIT_CARD' &&
    creditCardToken &&
    mapAsaasStatus(
      (await getPaymentSafe(paymentResult.asaas_payment_id)) ?? 'PENDING',
    ) === 'CONFIRMED'

  return NextResponse.json({
    orderNumber,
    asaas_payment_id: paymentResult.asaas_payment_id,
    paymentId:        paymentResult.asaas_payment_id,
    statusToken,
    invoiceUrl:       paymentResult.invoiceUrl,
    pixQrCode:        paymentResult.pixQrCode,
    pixCopiaECola:    paymentResult.pixCopiaECola,
    totalComJuros:    quote.totalComJuros,
    installmentValue: quote.installmentValue,
    installments,
    netValue:         quote.netValue,
    platformFee:      quote.platformFeeAmount + quote.platformFeeFixed,
    cardConfirmed,
    paymentMethod,
  })
}

async function getPaymentSafe(paymentId: string): Promise<string | null> {
  try {
    const p = await getPayment(paymentId)
    return p.status
  } catch {
    return null
  }
}

export async function handleCheckoutStatus(
  storeSlug: string,
  paymentId: string,
  token: string | null,
) {
  if (!token || !verifyCheckoutStatusToken(token, paymentId)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  if (!(await checkCheckoutStatusRateLimit(paymentId))) {
    return NextResponse.json(
      { error: 'Aguarde antes de consultar novamente.' },
      { status: 429 },
    )
  }

  const storeRows = await sql`
    SELECT
      id, plan, asaas_onboarding_status, asaas_wallet_id, is_demo, checkout_mode
    FROM stores
    WHERE slug = ${storeSlug}
    LIMIT 1
  `
  if (!storeRows[0]) {
    return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })
  }

  const storeRow = storeRows[0] as {
    id: string
    plan: string | null
    asaas_onboarding_status: string | null
    asaas_wallet_id: string | null
    is_demo: boolean | null
    checkout_mode: string | null
  }

  if (!isCheckoutEnabledForStore({
    plan:                    storeRow.plan ?? 'free',
    asaas_onboarding_status: storeRow.asaas_onboarding_status,
    asaas_wallet_id:         storeRow.asaas_wallet_id,
    is_demo:                 storeRow.is_demo,
  })) {
    return NextResponse.json({ error: 'Checkout integrado indisponível no momento.' }, { status: 503 })
  }

  const rows = await sql`
    SELECT payment_status, order_number, store_id
    FROM orders
    WHERE asaas_payment_id = ${paymentId}
    LIMIT 1
  `

  if (!rows[0]) {
    return NextResponse.json({ status: 'PENDING' })
  }

  const row = rows[0] as { payment_status: string | null; order_number: string; store_id: string }

  if (row.store_id !== storeRow.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let status = (row.payment_status ?? 'PENDING') as 'PENDING' | 'CONFIRMED' | 'FAILED'

  if (status === 'PENDING') {
    try {
      const asaasPayment = await getPayment(paymentId)
      const mapped = mapAsaasStatus(asaasPayment.status)
      if (mapped !== status) {
        await sql`
          UPDATE orders
          SET payment_status = ${mapped}
          WHERE asaas_payment_id = ${paymentId}
        `
        status = mapped
      }
    } catch (err) {
      logServerError('[checkout/status] getPayment', err)
    }
  }

  return NextResponse.json({
    status,
    orderNumber: row.order_number,
  })
}
