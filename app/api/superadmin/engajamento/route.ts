import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { requireSuperadmin } from '@/lib/superadmin'
export { dynamic } from '@/lib/route-dynamic'


export async function GET() {
  const { error } = await requireSuperadmin()
  if (error) return error

  try {
    const rows = await sql`
      SELECT
        s.id, s.name, s.slug, s.plan, s.last_login_at,
        EXTRACT(DAY FROM (NOW() - s.last_login_at))::int AS days_inactive,
        s.vi_messages_used,
        COUNT(DISTINCT o.id) FILTER (
          WHERE o.created_at > NOW() - INTERVAL '30 days'
        )::int AS orders_last_30d
      FROM stores s
      LEFT JOIN orders o ON o.store_id = s.id
      WHERE s.subscription_status = 'ACTIVE'
        AND COALESCE(s.is_demo, false) = false
      GROUP BY s.id
      ORDER BY days_inactive DESC NULLS FIRST
    `

    const withSegment = rows.map(r => {
      const days = r.days_inactive == null ? 999 : Number(r.days_inactive)
      let segment: 'risk' | 'attention' | 'engaged' = 'engaged'
      if (days >= 14) segment = 'risk'
      else if (days >= 7) segment = 'attention'
      return { ...r, segment }
    })

    return NextResponse.json({ stores: withSegment })
  } catch (e) {
    console.error('[superadmin/engajamento]', e)
    return NextResponse.json({ error: 'Falha ao carregar engajamento' }, { status: 500 })
  }
}
