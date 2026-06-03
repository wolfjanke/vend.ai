import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { requireSuperadmin } from '@/lib/superadmin'
import { getViLimit } from '@/lib/superadmin-metrics'

type Ctx = { params: { id: string } }

export async function GET(_req: Request, { params }: Ctx) {
  const { error } = await requireSuperadmin()
  if (error) return error

  try {
    const storeRows = await sql`
      SELECT s.*, COALESCE(s.owner_email, u.email) AS owner_email
      FROM stores s
      LEFT JOIN admin_users u ON u.store_id = s.id
      WHERE s.id = ${params.id}
      LIMIT 1
    `
    const store = storeRows[0]
    if (!store) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })
    }

    const [metrics] = await sql`
      SELECT
        COUNT(DISTINCT p.id)::int AS product_count,
        COUNT(DISTINCT o.id)::int AS order_count
      FROM stores s
      LEFT JOIN products p ON p.store_id = s.id
      LEFT JOIN orders o ON o.store_id = s.id
      WHERE s.id = ${params.id}
    `

    let billing: unknown[] = []
    try {
      billing = await sql`
        SELECT * FROM billing_history
        WHERE store_id = ${params.id}
        ORDER BY created_at DESC
        LIMIT 50
      `
    } catch {
      billing = []
    }

    const plan = (store.plan as string) ?? 'free'
    return NextResponse.json({
      store,
      metrics: {
        ...metrics,
        vi_limit: getViLimit(plan),
      },
      billing,
    })
  } catch (e) {
    console.error('[superadmin/clientes/id]', e)
    return NextResponse.json({ error: 'Falha ao carregar loja' }, { status: 500 })
  }
}
