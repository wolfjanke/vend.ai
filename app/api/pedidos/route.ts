import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { generateOrderNumber } from '@/lib/whatsapp'
import type { CartItem } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const { storeId, items, customerName, customerWhatsapp, notes }: {
      storeId:          string
      items:            CartItem[]
      customerName:     string
      customerWhatsapp: string
      notes?:           string
    } = await req.json()

    if (!storeId || !items?.length || !customerName || !customerWhatsapp) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    const total    = items.reduce((s, c) => s + c.price * c.qty, 0)
    const orderNum = generateOrderNumber()

    const itemsJson = JSON.stringify(items.map(i => ({
      product_id: i.product_id,
      name:       i.name,
      size:       i.size,
      color:      i.color,
      qty:        i.qty,
      price:      i.price,
    })))

    const [order] = await sql`
      INSERT INTO orders (store_id, order_number, customer_name, customer_whatsapp, items_json, total, notes, status)
      VALUES (
        ${storeId}, ${orderNum}, ${customerName},
        ${customerWhatsapp.replace(/\D/g, '')},
        ${itemsJson}::jsonb, ${total}, ${notes ?? ''}, 'NOVO'
      )
      RETURNING id
    `

    return NextResponse.json({ orderNumber: orderNum, orderId: order.id })
  } catch (error) {
    console.error('[/api/pedidos]', error)
    return NextResponse.json({ error: 'Erro ao criar pedido' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const storeId = searchParams.get('storeId')
    if (!storeId) return NextResponse.json({ error: 'storeId required' }, { status: 400 })

    const orders = await sql`SELECT * FROM orders WHERE store_id = ${storeId} ORDER BY created_at DESC`
    return NextResponse.json(orders)
  } catch (error) {
    console.error('[GET /api/pedidos]', error)
    return NextResponse.json({ error: 'Erro ao buscar pedidos' }, { status: 500 })
  }
}
