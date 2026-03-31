import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { generateOrderNumber } from '@/lib/whatsapp'
import { orderCreateSchema } from '@/lib/validations'
import { calculateCheckoutPricing } from '@/lib/pricing'
import type { StoreSettings } from '@/types'

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

    const { storeId, items, customerName, customerWhatsapp, notes, deliveryAddress, paymentMethod, couponCode } = parsed.data
    const orderNum = generateOrderNumber()
    const storeRows = await sql`SELECT settings_json FROM stores WHERE id = ${storeId} LIMIT 1`
    if (storeRows.length === 0) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })
    }
    const settings = (storeRows[0]?.settings_json as StoreSettings | null) ?? {}
    const pricing = calculateCheckoutPricing({
      items,
      paymentMethod,
      couponCode,
      settings,
    })

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
          ${itemsJson}::jsonb, ${pricing.totalFinal}, ${notes ?? ''}, 'NOVO',
          ${deliveryJson}::jsonb, ${pricing.subtotal}, ${pricing.discountPix}, ${pricing.discountCoupon},
          ${pricing.discountTotal}, ${pricing.totalFinal}, ${paymentMethod}, ${pricing.couponCodeApplied}
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
        paymentMethod,
        couponCodeApplied: pricing.couponCodeApplied,
      })}`
      ;[order] = await sql`
        INSERT INTO orders (store_id, order_number, customer_name, customer_whatsapp, items_json, total, notes, status, delivery_address)
        VALUES (
          ${storeId}, ${orderNum}, ${customerName},
          ${customerWhatsapp},
          ${itemsJson}::jsonb, ${pricing.totalFinal}, ${`${notes ?? ''}${pricingNote}`}, 'NOVO',
          ${deliveryJson}::jsonb
        )
        RETURNING id
      `
      console.warn('[/api/pedidos] fallback insert sem colunas de precificação', error)
    }

    return NextResponse.json({ orderNumber: orderNum, orderId: order.id, pricing })
  } catch (error) {
    console.error('[/api/pedidos]', error)
    return NextResponse.json({ error: 'Erro ao criar pedido' }, { status: 500 })
  }
}
