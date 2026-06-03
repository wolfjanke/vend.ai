import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { verifyCheckoutStatusToken } from '@/lib/checkout-status-token'
export { dynamic } from '@/lib/route-dynamic'


export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get('id')
  const token     = req.nextUrl.searchParams.get('token')

  if (!paymentId || !token) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  if (!verifyCheckoutStatusToken(token, paymentId)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const rows = await sql`
    SELECT payment_status, order_number
    FROM orders
    WHERE asaas_payment_id = ${paymentId}
    LIMIT 1
  `

  if (!rows[0]) {
    return NextResponse.json({ status: 'PENDING' })
  }

  return NextResponse.json({
    status:      rows[0].payment_status ?? 'PENDING',
    orderNumber: rows[0].order_number,
  })
}
