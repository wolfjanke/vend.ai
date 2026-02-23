import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const storeId = session.storeId
  const start   = new Date(); start.setHours(0, 0, 0, 0)
  const end     = new Date(); end.setHours(23, 59, 59, 999)

  const [novoRows, confRows, entregaRows, todayRows] = await Promise.all([
    sql`SELECT COUNT(*) as c FROM orders WHERE store_id = ${storeId} AND status = 'NOVO'`,
    sql`SELECT COUNT(*) as c FROM orders WHERE store_id = ${storeId} AND status = 'CONFIRMADO' AND created_at >= ${start.toISOString()} AND created_at <= ${end.toISOString()}`,
    sql`SELECT COUNT(*) as c FROM orders WHERE store_id = ${storeId} AND status = 'EM_ENTREGA'`,
    sql`SELECT total FROM orders WHERE store_id = ${storeId} AND created_at >= ${start.toISOString()} AND created_at <= ${end.toISOString()} AND status != 'CANCELADO'`,
  ])

  const totalHoje = (todayRows as { total: number }[]).reduce((s, o) => s + Number(o.total), 0)

  return NextResponse.json({
    novos:      Number(novoRows[0]?.c ?? 0),
    confirmados: Number(confRows[0]?.c ?? 0),
    emEntrega:  Number(entregaRows[0]?.c ?? 0),
    totalHoje,
  })
}
