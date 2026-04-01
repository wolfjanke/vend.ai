import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { generateOrderNumber } from '@/lib/whatsapp'
import { orderCreateSchema } from '@/lib/validations'
import { calculateCheckoutPricing } from '@/lib/pricing'
import { quoteDelivery } from '@/lib/delivery'
import type { StoreSettings } from '@/types'
import { logServerError } from '@/lib/logger'

export async function POST(req: NextRequest) {
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
        ?? 'Dados inválidos'
      return NextResponse.json({ error: first }, { status: 400 })
    }

    const {
      storeId,
      items,
      customerName,
      customerWhatsapp,
      notes,
      deliveryAddress,
      paymentMethod,
      couponCode,
      deliveryFee: clientDeliveryFee,
      checkoutChannel,
    } = parsed.data
    const orderNum = generateOrderNumber()
    const storeRows = await sql`SELECT settings_json FROM stores WHERE id = ${storeId} LIMIT 1`
    if (storeRows.length === 0) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })
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
        { status: 400 }
      )
    }
    const fee = Number(quote.fee.toFixed(2))
    if (Math.abs(fee - clientDeliveryFee) > 0.02) {
      return NextResponse.json({ error: 'Valor do frete desatualizado. Atualize a página e tente novamente.' }, { status: 400 })
    }
    const grandTotal = Math.max(0, Number((pricing.totalFinal + fee).toFixed(2)))

    const itemsJson = JSON.stringify(items.map(i => ({
      product_id: i.product_id,
      name:       i.name,
      size:       i.size,
      color:      i.color,
      qty:        i.qty,
      price:      i.price,
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
