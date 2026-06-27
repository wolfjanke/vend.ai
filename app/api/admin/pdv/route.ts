import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { requireSession } from '@/lib/require-session'
import { logServerError } from '@/lib/logger'
import { decrementStockForOrder, OrderValidationError } from '@/lib/order-pricing'
import type { CartItem } from '@/types'
import { canUsePdvForStore } from '@/lib/store-plan-access'
export { dynamic } from '@/lib/route-dynamic'

async function requirePdvPlan(storeId: string): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const rows = await sql`SELECT plan, is_demo, slug FROM stores WHERE id = ${storeId} LIMIT 1`
  if (!canUsePdvForStore(rows[0] ?? {})) {
    return { ok: false, status: 403, error: 'PDV disponível apenas no plano Loja' }
  }
  return { ok: true }
}


export async function GET(req: NextRequest) {
  const { session, unauthorized } = await requireSession()
  if (!session) return unauthorized!

  const gate = await requirePdvPlan(session.storeId)
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const date = req.nextUrl.searchParams.get('date') ?? new Date().toISOString().slice(0, 10)

  try {
    const orders = await sql`
      SELECT
        id, order_number, customer_name, total,
        payment_status, payment_method, created_at
      FROM orders
      WHERE store_id = ${session.storeId}
        AND payment_source = 'PDV'
        AND DATE(created_at AT TIME ZONE 'America/Sao_Paulo') = ${date}
      ORDER BY created_at DESC
    `
    return NextResponse.json({ orders })
  } catch (err) {
    logServerError('[GET /api/admin/pdv]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { session, unauthorized } = await requireSession()
  if (!session) return unauthorized!

  const gate = await requirePdvPlan(session.storeId)
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const {
    payment_method,
    payment_source = 'PDV',
    payment_status = 'CONFIRMED',
    customer_name  = 'Cliente PDV',
    customer_phone = '',
    items          = [],
    total,
    discount       = 0,
    asaas_payment_id,
  } = body as Record<string, unknown>

  if (!total || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'total e items são obrigatórios' }, { status: 422 })
  }

  const paymentStatus = String(payment_status)
  const cartItems: CartItem[] = (items as Array<Record<string, unknown>>)
    .filter(i => i.product_id && i.variant_id)
    .map(i => ({
      product_id: String(i.product_id),
      variant_id: String(i.variant_id),
      name:       String(i.name ?? ''),
      size:       String(i.size ?? ''),
      color:      String(i.color ?? ''),
      qty:        Number(i.qty),
      price:      Number(i.price),
      photo:      i.photo ? String(i.photo) : undefined,
    }))

  if (paymentStatus === 'CONFIRMED' && cartItems.length > 0) {
    try {
      await decrementStockForOrder(session.storeId, cartItems)
    } catch (e) {
      if (e instanceof OrderValidationError) {
        return NextResponse.json({ error: 'Estoque insuficiente para concluir a venda.' }, { status: 422 })
      }
      throw e
    }
  }

  try {
    const countRows = await sql`SELECT COUNT(*)::int as c FROM orders WHERE store_id = ${session.storeId}`
    const seq        = (Number(countRows[0]?.c ?? 0) + 1).toString().padStart(4, '0')
    const orderNumber = `PDV-${seq}`

    await sql`
      INSERT INTO orders (
        store_id, order_number, customer_name, customer_whatsapp,
        items_json, total, notes, status,
        payment_source, payment_status, payment_method, asaas_payment_id
      ) VALUES (
        ${session.storeId},
        ${orderNumber},
        ${String(customer_name)},
        ${String(customer_phone)},
        ${JSON.stringify(items)}::jsonb,
        ${Number(total)},
        ${discount ? `Desconto: R$ ${Number(discount).toFixed(2)}` : ''},
        'CONFIRMADO',
        ${String(payment_source)},
        ${String(payment_status)},
        ${payment_method ? String(payment_method) : null},
        ${asaas_payment_id ? String(asaas_payment_id) : null}
      )
    `

    return NextResponse.json({ success: true, orderNumber })
  } catch (err) {
    logServerError('[POST /api/admin/pdv]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
