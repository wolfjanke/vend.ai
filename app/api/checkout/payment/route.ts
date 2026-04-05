import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { logServerError } from '@/lib/logger'
import { checkoutPaymentSchema } from '@/lib/validations'
import { calculateInstallmentQuote } from '@/lib/payments/installment-fees'
import { createCheckoutPayment } from '@/lib/asaas/payments'
import { AsaasApiError } from '@/lib/asaas/client'
import type { Store, PlanSlug } from '@/types'

// Rate limiting simples em memória (por IP, máx 5 req/min)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 5
const RATE_WINDOW = 60_000

function checkRateLimit(ip: string): boolean {
  const now   = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }

  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  if (!checkRateLimit(ip)) {
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
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 422 })
  }

  const { storeSlug, billingType, installments, grossValue, creditCardToken, customer, items } = parsed.data

  // Buscar loja
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

  const plan = (store.plan ?? 'free') as PlanSlug

  let quote
  try {
    quote = calculateInstallmentQuote(grossValue, installments, plan)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 422 })
  }

  let paymentResult
  try {
    paymentResult = await createCheckoutPayment(
      store,
      quote,
      billingType,
      customer,
      items,
      creditCardToken,
    )
  } catch (err) {
    if (err instanceof AsaasApiError) {
      logServerError('[checkout/payment] AsaasApiError', { code: err.code, status: err.status })
      return NextResponse.json({ error: err.description, code: err.code }, { status: 502 })
    }
    logServerError('[checkout/payment] createCheckoutPayment', err)
    return NextResponse.json({ error: 'Erro ao criar cobrança' }, { status: 500 })
  }

  // Gerar order_number
  const countRows = await sql`SELECT COUNT(*)::int as c FROM orders WHERE store_id = ${store.id}`
  const orderSeq  = (Number(countRows[0]?.c ?? 0) + 1).toString().padStart(4, '0')
  const orderNumber = `CHK-${orderSeq}`

  const platformFeeAmount = Math.round(grossValue * (quote.platformTakePct / 100) * 100) / 100

  // INSERT atômico do pedido
  try {
    await sql`
      INSERT INTO orders (
        store_id,
        order_number,
        customer_name,
        customer_whatsapp,
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
        ${JSON.stringify(items)}::jsonb,
        ${quote.totalComJuros},
        '',
        'NOVO',
        'CHECKOUT',
        'PENDING',
        ${paymentResult.asaas_payment_id},
        ${grossValue},
        ${installments},
        ${quote.installmentValue},
        ${quote.platformTakePct / 100},
        ${platformFeeAmount}
      )
    `
  } catch (err) {
    logServerError('[checkout/payment] INSERT order', err)
    // Não retornar erro ao cliente — cobrança já foi criada no Asaas
    // O webhook irá atualizar o status do pedido
  }

  return NextResponse.json({
    orderNumber,
    asaas_payment_id: paymentResult.asaas_payment_id,
    invoiceUrl:       paymentResult.invoiceUrl,
    pixQrCode:        paymentResult.pixQrCode,
    pixCopiaECola:    paymentResult.pixCopiaECola,
    totalComJuros:    quote.totalComJuros,
    installmentValue: quote.installmentValue,
    installments,
  })
}
