import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { requireSuperadmin } from '@/lib/superadmin'
export { dynamic } from '@/lib/route-dynamic'


export async function GET() {
  const { error } = await requireSuperadmin()
  if (error) return error

  try {
    const trials = await sql`
      SELECT
        s.id, s.name, s.slug, s.plan,
        COALESCE(s.owner_email, u.email) AS owner_email,
        s.trial_ends_at,
        EXTRACT(DAY FROM (s.trial_ends_at - NOW()))::int AS days_remaining,
        s.vi_messages_used,
        s.last_login_at,
        COUNT(DISTINCT p.id)::int AS products_added,
        COUNT(DISTINCT o.id)::int AS orders_count
      FROM stores s
      LEFT JOIN admin_users u ON u.store_id = s.id
      LEFT JOIN products p ON p.store_id = s.id
      LEFT JOIN orders o ON o.store_id = s.id
      WHERE s.trial_ends_at > NOW()
        AND (s.subscription_status = 'TRIAL' OR s.subscription_status IS NULL)
      GROUP BY s.id, u.email
      ORDER BY s.trial_ends_at ASC
    `

    const withScore = trials.map(t => {
      const products = Number(t.products_added)
      const orders = Number(t.orders_count)
      const vi = Number(t.vi_messages_used ?? 0)
      let activation: 'green' | 'yellow' | 'red' = 'red'
      if (products >= 1 && vi > 0 && orders >= 1) activation = 'green'
      else if (products >= 1) activation = 'yellow'
      return { ...t, activation }
    })

    return NextResponse.json({ trials: withScore })
  } catch (e) {
    console.error('[superadmin/trials]', e)
    return NextResponse.json({ error: 'Falha ao carregar trials' }, { status: 500 })
  }
}
