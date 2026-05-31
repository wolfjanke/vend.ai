import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { generateOrderNumber } from '@/lib/whatsapp'
import { orderCreateSchema } from '@/lib/validations'
import { calculateCheckoutPricing } from '@/lib/pricing'
import { quoteDelivery } from '@/lib/delivery'
import type { StoreSettings } from '@/types'
import { logServerError } from '@/lib/logger'
import { resolveOrderLines, amountsMatch, OrderValidationError, decrementStockForOrder } from '@/lib/order-pricing'
import { orderReject422, validationErrorResponse } from '@/lib/api-errors'
import { checkRateLimit, clientIp } from '@/lib/rate-limit'

const PEDIDOS_IP_LIMIT = 10
const PEDIDOS_IP_WINDOW = 60_000
const PEDIDOS_STORE_LIMIT = 30
const PEDIDOS_STORE_WINDOW = 60_000

export async function POST(req: NextRequest) {
  const ip = clientIp(req)

  if (!checkRateLimit(`pedidos:ip:${ip}`, PEDIDOS_IP_LIMIT, PEDIDOS_IP_WINDOW)) {
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
      storeId,
      items: clientItems,
      customerName,
      customerWhatsapp,
      notes,
      deliveryAddress,
      paymentMethod,
      couponCode,
      deliveryFee: clientDeliveryFee,
      checkoutChannel,
    } = parsed.data

    if (!checkRateLimit(`pedidos:store:${storeId}`, PEDIDOS_STORE_LIMIT, PEDIDOS_STORE_WINDOW)) {
      return NextResponse.json({ error: 'Muitas tentativas. Aguarde um momento.' }, { status: 429 })
    }

    const storeRows = await sql`SELECT settings_json FROM stores WHERE id = ${storeId} LIMIT 1`
    if (storeRows.length === 0) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })
    }

    let items
    try {
      items = await resolveOrderLines(storeId, clientItems)
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
    const fee = Number(quote.fee.toFixed(2))
    if (!amountsMatch(fee, clientDeliveryFee, 0.02)) {
      return orderReject422()
    }
    const grandTotal = Math.max(0, Number((pricing.totalFinal + fee).toFixed(2)))

    const clientSubtotal = clientItems.reduce((s, i) => s + i.price * i.qty, 0)
    if (!amountsMatch(pricing.subtotal, clientSubtotal)) {
      return orderReject422()
    }

    try {
      await decrementStockForOrder(storeId, items)
    } catch (e) {
      if (e instanceof OrderValidationError) return orderReject422()
      throw e
    }

    const orderNum = generateOrderNumber()

    const itemsJson = JSON.stringify(items.map(i => ({
      product_id: i.product_id,
      name:       i.name,
      size:       i.size,
      color:      i.color,
      qty:        i.qty,
      price:      i.price,
      photo:      i.photo,
    })))

    const deliveryJson = JSON.stringify(deliveryAddress)

    let order
    try {
      ;[order] = await sql`
        INSERT INTO orders (
          store_id, order_number, customer_name, customer_whatsapp, items_json,
          total, notes, status, delivery_address,
          subtotal, discount_pix, discount_coupon, discount_total, total_final, payment_method, coupon_code_applied
        )
        VALUES (
          ${storeId}, ${orderNum}, ${customerName}, ${customerWhatsapp},
          ${itemsJson}::jsonb, ${grandTotal}, ${notes ?? ''}, 'NOVO',
          ${deliveryJson}::jsonb, ${pricing.subtotal}, ${pricing.discountPix}, ${pricing.discountCoupon},
          ${pricing.discountTotal}, ${grandTotal}, ${paymentMethod}, ${pricing.couponCodeApplied}
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
        INSERT INTO orders (store_id, order_number, customer_name, customer_whatsapp, items_json, total, notes, status, delivery_address)
        VALUES (
          ${storeId}, ${orderNum}, ${customerName},
          ${customerWhatsapp},
          ${itemsJson}::jsonb, ${grandTotal}, ${`${notes ?? ''}${pricingNote}`}, 'NOVO',
          ${deliveryJson}::jsonb
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
