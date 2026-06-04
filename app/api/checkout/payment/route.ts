import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { logServerError } from '@/lib/logger'
import { checkoutPaymentSchema } from '@/lib/validations'
import { calculateInstallmentQuote } from '@/lib/payments/installment-fees'
import { createCheckoutPayment } from '@/lib/asaas/payments'
import { AsaasApiError } from '@/lib/asaas/client'
import type { Store, PlanSlug } from '@/types'
import { resolveOrderLines, amountsMatch, OrderValidationError } from '@/lib/order-pricing'
import { orderReject422, validationErrorResponse } from '@/lib/api-errors'
import { checkRateLimit, clientIp } from '@/lib/rate-limit'
import { signCheckoutStatusToken } from '@/lib/checkout-status-token'
export { dynamic } from '@/lib/route-dynamic'


const RATE_LIMIT = 5
const RATE_WINDOW = 60_000

export async function POST(req: NextRequest) {
  const ip = clientIp(req)

  if (!checkRateLimit(`checkout:ip:${ip}`, RATE_LIMIT, RATE_WINDOW)) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde 1 minuto.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = checkoutPaymentSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message
    return validationErrorResponse(first)
  }

  const {
    storeSlug,
    billingType,
    installments,
    grossValue: clientGrossValue,
    creditCardToken,
    customer,
    cartItems,
  } = parsed.data

  const storeRows = await sql`
    SELECT
      id, slug, plan,
      asaas_wallet_id,
      asaas_onboarding_status
    FROM stores
    WHERE slug = ${storeSlug}
    LIMIT 1
  `

  const store = storeRows[0] as Store & { id: string } | undefined

  if (!store) {
    return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })
  }

  if (store.asaas_onboarding_status !== 'APPROVED') {
    return NextResponse.json({ error: 'Checkout não disponível para esta loja' }, { status: 403 })
  }

  if (!store.asaas_wallet_id) {
    return NextResponse.json({ error: 'Loja sem conta de recebimento configurada' }, { status: 403 })
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

  const plan = (store.plan ?? 'free') as PlanSlug

  let quote
  try {
    quote = calculateInstallmentQuote(serverGrossValue, installments, plan)
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
      store,
      quote,
      billingType,
      customer,
      asaasItems,
      creditCardToken,
    )
  } catch (err) {
    if (err instanceof AsaasApiError) {
      logServerError('[checkout/payment] AsaasApiError', { code: err.code, status: err.status })
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Erro ao processar pagamento.' }, { status: 502 })
      }
      return NextResponse.json({ error: err.description, code: err.code }, { status: 502 })
    }
    logServerError('[checkout/payment] createCheckoutPayment', err)
    return NextResponse.json({ error: 'Erro ao criar cobrança' }, { status: 500 })
  }

  const countRows = await sql`SELECT COUNT(*)::int as c FROM orders WHERE store_id = ${store.id}`
  const orderSeq  = (Number(countRows[0]?.c ?? 0) + 1).toString().padStart(4, '0')
  const orderNumber = `CHK-${orderSeq}`

  const platformFeeAmount = Math.round(serverGrossValue * (quote.platformTakePct / 100) * 100) / 100

  const itemsJson = JSON.stringify(lines.map(i => ({
    product_id: i.product_id,
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
        items_json,
        total,
        notes,
        status,
        payment_source,
        payment_status,
        asaas_payment_id,
        checkout_gross_value,
        checkout_installment_count,
        checkout_installment_value,
        platform_fee_pct,
        platform_fee_amount
      ) VALUES (
        ${store.id},
        ${orderNumber},
        ${customer.name},
        ${customer.mobilePhone ?? ''},
        ${customer.email?.trim() || null},
        ${itemsJson}::jsonb,
        ${quote.totalComJuros},
        '',
        'NOVO',
        'CHECKOUT',
        'PENDING',
        ${paymentResult.asaas_payment_id},
        ${serverGrossValue},
        ${installments},
        ${quote.installmentValue},
        ${quote.platformTakePct / 100},
        ${platformFeeAmount}
      )
    `
  } catch (err) {
    logServerError('[checkout/payment] INSERT order', err)
  }

  const statusToken = signCheckoutStatusToken(paymentResult.asaas_payment_id)

  return NextResponse.json({
    orderNumber,
    asaas_payment_id: paymentResult.asaas_payment_id,
    statusToken,
    invoiceUrl:       paymentResult.invoiceUrl,
    pixQrCode:        paymentResult.pixQrCode,
    pixCopiaECola:    paymentResult.pixCopiaECola,
    totalComJuros:    quote.totalComJuros,
    installmentValue: quote.installmentValue,
    installments,
  })
}
