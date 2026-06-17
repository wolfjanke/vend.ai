import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { requireSuperadmin, formatBrl } from '@/lib/superadmin'
import { computeTotalMrr, planPriceCents } from '@/lib/superadmin-metrics'
export { dynamic } from '@/lib/route-dynamic'


export async function GET() {
  const { error } = await requireSuperadmin()
  if (error) return error

  try {
    const mrrCents = await computeTotalMrr()

    const mrrByPlan = await sql`
      SELECT plan, COUNT(*)::int AS count
      FROM stores
      WHERE subscription_status = 'ACTIVE' AND plan != 'free'
      GROUP BY plan
    `

    const mrrByPlanFormatted = mrrByPlan.map(r => ({
      plan: r.plan,
      count: Number(r.count),
      mrrCents: planPriceCents(r.plan as string) * Number(r.count),
    }))

    const overdue = await sql`
      SELECT s.id, s.name, s.slug, s.plan,
        COALESCE(s.owner_email, u.email) AS owner_email,
        s.subscription_ends_at
      FROM stores s
      LEFT JOIN admin_users u ON u.store_id = s.id
      WHERE s.subscription_status = 'OVERDUE'
      ORDER BY s.subscription_ends_at ASC NULLS LAST
    `

    let revenueByMonth: { month: string; total_cents: number }[] = []
    try {
      const rev = await sql`
        SELECT date_trunc('month', created_at) AS month,
          COALESCE(SUM(amount_cents), 0)::int AS total_cents
        FROM billing_history
        WHERE created_at >= NOW() - INTERVAL '12 months'
        GROUP BY 1
        ORDER BY 1 DESC
        LIMIT 12
      `
      revenueByMonth = rev.map(r => ({
        month: String(r.month),
        total_cents: Number(r.total_cents),
      }))
    } catch {
      revenueByMonth = []
    }

    return NextResponse.json({
      mrrCents,
      mrrFormatted: formatBrl(mrrCents),
      arrFormatted: formatBrl(mrrCents * 12),
      overdueCount: overdue.length,
      mrrByPlan: mrrByPlanFormatted,
      overdue,
      revenueByMonth,
    })
  } catch (e) {
    console.error('[superadmin/financeiro]', e)
    return NextResponse.json({ error: 'Falha ao carregar financeiro' }, { status: 500 })
  }
}
