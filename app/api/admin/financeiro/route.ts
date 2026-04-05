import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSessionSafe } from '@/lib/auth'
import { logServerError } from '@/lib/logger'

export async function GET(req: NextRequest) {
  const session = await getSessionSafe()
  if (!session?.storeId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const now     = new Date()
  const year    = now.getFullYear()
  const month   = (now.getMonth() + 1).toString().padStart(2, '0')
  const defaultFrom = `${year}-${month}-01`
  const defaultTo   = now.toISOString().slice(0, 10)

  const from = req.nextUrl.searchParams.get('from') ?? defaultFrom
  const to   = req.nextUrl.searchParams.get('to')   ?? defaultTo

  try {
    // GMV e taxa plataforma totais
    const summary = await sql`
      SELECT
        COALESCE(SUM(checkout_gross_value), 0)::float    AS gmv_total,
        COALESCE(SUM(platform_fee_amount), 0)::float     AS fee_total,
        COUNT(*)::int                                     AS order_count
      FROM orders
      WHERE store_id = ${session.storeId}
        AND payment_source IN ('CHECKOUT', 'PDV')
        AND DATE(created_at AT TIME ZONE 'America/Sao_Paulo') BETWEEN ${from} AND ${to}
    `

    // Breakdown por origem
    const bySource = await sql`
      SELECT
        payment_source,
        COALESCE(SUM(checkout_gross_value), 0)::float  AS gmv,
        COALESCE(SUM(platform_fee_amount), 0)::float   AS fee,
        COUNT(*)::int                                   AS count
      FROM orders
      WHERE store_id = ${session.storeId}
        AND payment_source IN ('CHECKOUT', 'PDV')
        AND DATE(created_at AT TIME ZONE 'America/Sao_Paulo') BETWEEN ${from} AND ${to}
      GROUP BY payment_source
    `

    // Breakdown por status de split
    const bySplitStatus = await sql`
      SELECT
        COALESCE(asaas_split_status, 'PENDING') AS split_status,
        COALESCE(SUM(checkout_gross_value), 0)::float  AS gmv,
        COUNT(*)::int                                   AS count
      FROM orders
      WHERE store_id = ${session.storeId}
        AND payment_source IN ('CHECKOUT', 'PDV')
        AND DATE(created_at AT TIME ZONE 'America/Sao_Paulo') BETWEEN ${from} AND ${to}
      GROUP BY asaas_split_status
    `

    return NextResponse.json({
      period:      { from, to },
      summary:     summary[0],
      bySource,
      bySplitStatus,
    })
  } catch (err) {
    logServerError('[GET /api/admin/financeiro]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
