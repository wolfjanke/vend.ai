import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { requireSuperadmin } from '@/lib/superadmin'
export { dynamic } from '@/lib/route-dynamic'


export async function GET(req: NextRequest) {
  const { error } = await requireSuperadmin()
  if (error) return error

  const type = req.nextUrl.searchParams.get('type') ?? 'all'
  const window = req.nextUrl.searchParams.get('window') ?? '7d'

  try {
    const events: Array<{
      id: string
      type: string
      title: string
      at: string
      meta?: string
    }> = []

    const signupQuery =
      window === '24h'
        ? sql`SELECT id, name, slug, created_at FROM stores WHERE created_at > NOW() - INTERVAL '24 hours' ORDER BY created_at DESC LIMIT 50`
        : window === '30d'
          ? sql`SELECT id, name, slug, created_at FROM stores WHERE created_at > NOW() - INTERVAL '30 days' ORDER BY created_at DESC LIMIT 50`
          : sql`SELECT id, name, slug, created_at FROM stores WHERE created_at > NOW() - INTERVAL '7 days' ORDER BY created_at DESC LIMIT 50`

    if (type === 'all' || type === 'signup') {
      const signups = await signupQuery
      for (const s of signups) {
        events.push({
          id: `store-${s.id}`,
          type: 'signup',
          title: `Novo cadastro: ${s.name}`,
          at: String(s.created_at),
          meta: String(s.slug),
        })
      }
    }

    if (type === 'all' || type === 'payment') {
      try {
        const billing = await sql`
          SELECT bh.id, bh.type, bh.amount_cents, bh.created_at, s.name
          FROM billing_history bh
          JOIN stores s ON s.id = bh.store_id
          WHERE bh.created_at > NOW() - INTERVAL '30 days'
          ORDER BY bh.created_at DESC
          LIMIT 50
        `
        for (const b of billing) {
          events.push({
            id: `bill-${b.id}`,
            type: 'payment',
            title: `${b.type} — ${b.name}`,
            at: String(b.created_at),
            meta: `R$ ${(Number(b.amount_cents) / 100).toFixed(2)}`,
          })
        }
      } catch { /* */ }
    }

    if (type === 'all' || type === 'webhook') {
      try {
        const hooks = await sql`
          SELECT id, event_type, processed_at
          FROM webhook_events_asaas
          WHERE processed_at > NOW() - INTERVAL '30 days'
          ORDER BY processed_at DESC
          LIMIT 30
        `
        for (const h of hooks) {
          events.push({
            id: `wh-${h.id}`,
            type: 'webhook',
            title: String(h.event_type),
            at: String(h.processed_at),
          })
        }
      } catch { /* */ }
    }

    events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())

    return NextResponse.json({ events: events.slice(0, 100) })
  } catch (e) {
    console.error('[superadmin/logs]', e)
    return NextResponse.json({ error: 'Falha ao carregar logs' }, { status: 500 })
  }
}
