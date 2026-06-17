import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { requireSuperadmin } from '@/lib/superadmin'
export { dynamic } from '@/lib/route-dynamic'


export async function GET(req: NextRequest) {
  const { error } = await requireSuperadmin()
  if (error) return error

  const plan = req.nextUrl.searchParams.get('plan')
  const status = req.nextUrl.searchParams.get('status')
  const q = req.nextUrl.searchParams.get('q')?.trim().toLowerCase()

  try {
    const rows = await sql`
      SELECT
        s.id, s.name, s.slug, s.plan, s.subscription_status, s.is_demo,
        s.created_at, s.last_login_at, s.trial_ends_at,
        s.theme_logo_url, s.vi_messages_used,
        COALESCE(s.owner_email, u.email) AS owner_email,
        COUNT(DISTINCT p.id)::int AS product_count,
        COUNT(DISTINCT o.id)::int AS order_count
      FROM stores s
      LEFT JOIN admin_users u ON u.store_id = s.id
      LEFT JOIN products p ON p.store_id = s.id
      LEFT JOIN orders o ON o.store_id = s.id
      GROUP BY s.id, u.email
      ORDER BY s.created_at DESC
    `

    let stores = rows
    if (plan && plan !== 'all') {
      stores = stores.filter(r => (r.plan as string) === plan)
    }
    if (status && status !== 'all') {
      stores = stores.filter(r => (r.subscription_status as string) === status)
    }
    if (q) {
      stores = stores.filter(r => {
        const name = String(r.name ?? '').toLowerCase()
        const slug = String(r.slug ?? '').toLowerCase()
        const email = String(r.owner_email ?? '').toLowerCase()
        return name.includes(q) || slug.includes(q) || email.includes(q)
      })
    }

    return NextResponse.json({ stores })
  } catch (e) {
    console.error('[superadmin/clientes]', e)
    return NextResponse.json({ error: 'Falha ao listar clientes' }, { status: 500 })
  }
}
