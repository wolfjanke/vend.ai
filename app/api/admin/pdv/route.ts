import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSessionSafe } from '@/lib/auth'
import { logServerError } from '@/lib/logger'

export async function GET(req: NextRequest) {
  const session = await getSessionSafe()
  if (!session?.storeId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

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
  const session = await getSessionSafe()
  if (!session?.storeId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

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
