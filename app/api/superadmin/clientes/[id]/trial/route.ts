import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { requireSuperadmin } from '@/lib/superadmin'

type Ctx = { params: { id: string } }

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { error } = await requireSuperadmin()
  if (error) return error

  const body = await req.json().catch(() => ({}))
  const days = Math.min(90, Math.max(1, Number(body.days) || 7))

  try {
    await sql`
      UPDATE stores SET
        trial_ends_at = NOW() + (${days}::int * INTERVAL '1 day'),
        subscription_status = 'TRIAL'
      WHERE id = ${params.id}
    `
    return NextResponse.json({ ok: true, days })
  } catch (e) {
    console.error('[superadmin/trial]', e)
    return NextResponse.json({ error: 'Falha ao estender trial' }, { status: 500 })
  }
}
