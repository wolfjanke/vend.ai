import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { generateOrderNumber } from '@/lib/whatsapp'
import { orderCreateSchema } from '@/lib/validations'

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

    const { storeId, items, customerName, customerWhatsapp, notes, deliveryAddress } = parsed.data

    const total = items.reduce((s, c) => s + c.price * c.qty, 0)
    const orderNum = generateOrderNumber()

    const itemsJson = JSON.stringify(items.map(i => ({
      product_id: i.product_id,
      name:       i.name,
      size:       i.size,
      color:      i.color,
      qty:        i.qty,
      price:      i.price,
    })))

    const deliveryJson = JSON.stringify(deliveryAddress)

    const [order] = await sql`
      INSERT INTO orders (store_id, order_number, customer_name, customer_whatsapp, items_json, total, notes, status, delivery_address)
      VALUES (
        ${storeId}, ${orderNum}, ${customerName},
        ${customerWhatsapp},
        ${itemsJson}::jsonb, ${total}, ${notes ?? ''}, 'NOVO',
        ${deliveryJson}::jsonb
      )
      RETURNING id
    `

    return NextResponse.json({ orderNumber: orderNum, orderId: order.id })
  } catch (error) {
    console.error('[/api/pedidos]', error)
    return NextResponse.json({ error: 'Erro ao criar pedido' }, { status: 500 })
  }
}
