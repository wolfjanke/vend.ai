import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { generateOrderNumber } from '@/lib/whatsapp'
import { orderCreateSchema } from '@/lib/validations'
import { calculateCheckoutPricing } from '@/lib/pricing'
import { quoteDelivery } from '@/lib/delivery'
import type { StoreSettings } from '@/types'
import { logServerError } from '@/lib/logger'
import { encryptCpf } from '@/lib/crypto/pii'
import { resolveOrderLines, amountsMatch, OrderValidationError } from '@/lib/order-pricing'
import { orderReject422, validationErrorResponse } from '@/lib/api-errors'
import { checkRateLimit, resolveRateLimitIp } from '@/lib/rate-limit'
import {
  PEDIDOS_IP_LIMIT,
  PEDIDOS_IP_WINDOW_MS,
  PEDIDOS_STORE_LIMIT,
  PEDIDOS_STORE_WINDOW_MS,
} from '@/lib/rate-limit-config'

export { dynamic } from '@/lib/route-dynamic'

export async function POST(req: NextRequest) {
  const ip = resolveRateLimitIp(req)

  if (!(await checkRateLimit(`pedidos:ip:${ip}`, PEDIDOS_IP_LIMIT, PEDIDOS_IP_WINDOW_MS))) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde um momento.' }, { status: 429 })
  }

  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const parsed = orderCreateSchema.safeParse(body)
    if (!parsed.success) {
      const first =
        Object.values(parsed.error.flatten().fieldErrors).flat()[0]
        ?? parsed.error.issues[0]?.message
      return validationErrorResponse(first)
    }

    const {
      storeSlug,
      items: clientItems,
      customerName,
      customerWhatsapp,
      customerCpf,
      notes,
      deliveryAddress,
      paymentMethod,
      couponCode,
      deliveryFee: clientDeliveryFee,
      checkoutChannel,
      payment_source: paymentSource,
    } = parsed.data

    const storeRows = await sql`SELECT id, settings_json FROM stores WHERE slug = ${storeSlug} LIMIT 1`
    if (storeRows.length === 0) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })
    }

    const storeId = storeRows[0].id as string

    if (!(await checkRateLimit(`pedidos:store:${storeId}`, PEDIDOS_STORE_LIMIT, PEDIDOS_STORE_WINDOW_MS))) {
      return NextResponse.json({ error: 'Muitas tentativas. Aguarde um momento.' }, { status: 429 })
    }

    let items
    try {
      items = await resolveOrderLines(storeId, clientItems, { checkStock: false })
    } catch (e) {
      if (e instanceof OrderValidationError) return orderReject422()
      throw e
    }

    const settings = (storeRows[0]?.settings_json as StoreSettings | null) ?? {}
    const paymentForPricing = paymentMethod === 'PIX' ? 'PIX' : 'OUTRO'
    const pricing = calculateCheckoutPricing({
      items,
      paymentMethod: paymentForPricing,
      couponCode,
      settings,
    })
    const subtotalAfterCoupon = Math.max(0, Number((pricing.subtotal - pricing.discountCoupon).toFixed(2)))
    let fee = 0
    if (deliveryAddress) {
      const quote = quoteDelivery({
        settings,
        cidade: deliveryAddress.cidade,
        uf: deliveryAddress.uf,
        subtotalAfterCoupon,
      })
      if (quote.outOfZone) {
        return NextResponse.json(
          { error: 'Entrega não disponível para o endereço informado.' },
          { status: 400 },
        )
      }
      fee = Number(quote.fee.toFixed(2))
    }
    if (!amountsMatch(fee, clientDeliveryFee, 0.02)) {
      return orderReject422()
    }
    const grandTotal = Math.max(0, Number((pricing.totalFinal + fee).toFixed(2)))

    const clientSubtotal = clientItems.reduce((s, i) => s + i.price * i.qty, 0)
    if (!amountsMatch(pricing.subtotal, clientSubtotal)) {
      return orderReject422()
    }

    const orderNum = generateOrderNumber()

    const itemsJson = JSON.stringify(items.map(i => ({
      product_id: i.product_id,
      variant_id: i.variant_id,
      name:       i.name,
      size:       i.size,
      color:      i.color,
      qty:        i.qty,
      price:      i.price,
      photo:      i.photo,
    })))

    const deliveryJson = deliveryAddress ? JSON.stringify(deliveryAddress) : null
    const resolvedPaymentSource = paymentSource ?? (checkoutChannel === 'whatsapp' ? 'WHATSAPP' : 'WHATSAPP')

    let customerCpfEnc: string | null = null
    if (customerCpf) {
      try {
        customerCpfEnc = await encryptCpf(customerCpf)
      } catch (error) {
        logServerError('[/api/pedidos] encryptCpf', error)
        return NextResponse.json({ error: 'CPF inválido' }, { status: 400 })
      }
    }

    let order
    try {
      ;[order] = await sql`
        INSERT INTO orders (
          store_id, order_number, customer_name, customer_whatsapp, customer_cpf_enc, items_json,
          total, notes, status, delivery_address,
          subtotal, discount_pix, discount_coupon, discount_total, total_final, payment_method, coupon_code_applied,
          payment_source, payment_status,
          privacy_consent_at
        )
        VALUES (
          ${storeId}, ${orderNum}, ${customerName}, ${customerWhatsapp}, ${customerCpfEnc},
          ${itemsJson}::jsonb, ${grandTotal}, ${notes ?? ''}, 'NOVO',
          ${deliveryJson}::jsonb, ${pricing.subtotal}, ${pricing.discountPix}, ${pricing.discountCoupon},
          ${pricing.discountTotal}, ${grandTotal}, ${paymentMethod}, ${pricing.couponCodeApplied},
          ${resolvedPaymentSource}, 'PENDING',
          NOW()
        )
        RETURNING id
      `
    } catch (error) {
      const pricingNote = `\n[pricing] ${JSON.stringify({
        subtotal: pricing.subtotal,
        discountPix: pricing.discountPix,
        discountCoupon: pricing.discountCoupon,
        discountTotal: pricing.discountTotal,
        totalFinal: pricing.totalFinal,
        deliveryFee: fee,
        grandTotal,
        paymentMethod,
        couponCodeApplied: pricing.couponCodeApplied,
        checkoutChannel,
      })}`
      ;[order] = await sql`
        INSERT INTO orders (
          store_id, order_number, customer_name, customer_whatsapp, customer_cpf_enc, items_json, total, notes, status,
          delivery_address, payment_source, payment_status, privacy_consent_at
        )
        VALUES (
          ${storeId}, ${orderNum}, ${customerName},
          ${customerWhatsapp}, ${customerCpfEnc},
          ${itemsJson}::jsonb, ${grandTotal}, ${`${notes ?? ''}${pricingNote}`}, 'NOVO',
          ${deliveryJson}::jsonb,
          ${resolvedPaymentSource}, 'PENDING',
          NOW()
        )
        RETURNING id
      `
      logServerError('[/api/pedidos] fallback insert sem colunas de precificação', error)
    }

    return NextResponse.json({
      orderNumber: orderNum,
      orderId:     order.id,
      pricing:     { ...pricing, deliveryFee: fee, grandTotal, checkoutChannel },
    })
  } catch (error) {
    logServerError('[/api/pedidos]', error)
    return NextResponse.json({ error: 'Erro ao criar pedido' }, { status: 500 })
  }
}
