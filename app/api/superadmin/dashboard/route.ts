import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { requireSuperadmin, formatBrl } from '@/lib/superadmin'
import { computeTotalMrr } from '@/lib/superadmin-metrics'
export { dynamic } from '@/lib/route-dynamic'


export async function GET() {
  const { error } = await requireSuperadmin()
  if (error) return error

  try {
    const mrrCents = await computeTotalMrr()

    const [newRow] = await sql`
      SELECT COUNT(*)::int AS c FROM stores
      WHERE created_at >= date_trunc('month', NOW())
        AND COALESCE(is_demo, false) = false
    `
    const [churnRow] = await sql`
      SELECT COUNT(*)::int AS c FROM stores
      WHERE subscription_status = 'CANCELLED'
        AND subscription_ends_at >= date_trunc('month', NOW())
        AND subscription_ends_at < date_trunc('month', NOW()) + INTERVAL '1 month'
        AND COALESCE(is_demo, false) = false
    `
    const [trialsRow] = await sql`
      SELECT COUNT(*)::int AS c FROM stores
      WHERE trial_ends_at > NOW() AND subscription_status = 'TRIAL'
        AND COALESCE(is_demo, false) = false
    `
    const [inactiveRow] = await sql`
      SELECT COUNT(*)::int AS c FROM stores
      WHERE subscription_status = 'ACTIVE'
        AND (last_login_at IS NULL OR last_login_at < NOW() - INTERVAL '7 days')
        AND COALESCE(is_demo, false) = false
    `
    const [totalRow] = await sql`
      SELECT COUNT(*)::int AS c FROM stores
      WHERE subscription_status = 'ACTIVE'
        AND COALESCE(is_demo, false) = false
    `

    const recentStores = await sql`
      SELECT s.id, s.name, s.slug, s.plan, s.subscription_status,
        s.created_at, s.last_login_at,
        COALESCE(s.owner_email, u.email) AS owner_email
      FROM stores s
      LEFT JOIN admin_users u ON u.store_id = s.id
      WHERE COALESCE(s.is_demo, false) = false
      ORDER BY s.created_at DESC
      LIMIT 5
    `

    const signupsByMonth = await sql`
      SELECT date_trunc('month', created_at) AS month, COUNT(*)::int AS count
      FROM stores
      WHERE created_at >= NOW() - INTERVAL '6 months'
        AND COALESCE(is_demo, false) = false
      GROUP BY 1
      ORDER BY 1 ASC
    `

    let revenueByMonth: { month: string; total_cents: number }[] = []
    try {
      const rev = await sql`
        SELECT date_trunc('month', bh.created_at) AS month,
          COALESCE(SUM(bh.amount_cents), 0)::int AS total_cents
        FROM billing_history bh
        INNER JOIN stores st ON st.id = bh.store_id AND COALESCE(st.is_demo, false) = false
        WHERE bh.created_at >= NOW() - INTERVAL '6 months'
        GROUP BY 1
        ORDER BY 1 ASC
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
      newThisMonth: Number(newRow?.c ?? 0),
      churnThisMonth: Number(churnRow?.c ?? 0),
      activeTrials: Number(trialsRow?.c ?? 0),
      inactive7d: Number(inactiveRow?.c ?? 0),
      totalActive: Number(totalRow?.c ?? 0),
      recentStores,
      signupsByMonth: signupsByMonth.map(r => ({
        month: String(r.month),
        count: Number(r.count),
      })),
      revenueByMonth,
    })
  } catch (e) {
    console.error('[superadmin/dashboard]', e)
    return NextResponse.json({ error: 'Falha ao carregar métricas' }, { status: 500 })
  }
}
