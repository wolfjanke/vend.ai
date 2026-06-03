import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { requireSuperadmin } from '@/lib/superadmin'
export { dynamic } from '@/lib/route-dynamic'


const VALID = ['TRIAL', 'ACTIVE', 'OVERDUE', 'CANCELLED'] as const

type Ctx = { params: { id: string } }

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { error } = await requireSuperadmin()
  if (error) return error

  const body = await req.json().catch(() => ({}))
  const status = body.status as string
  if (!VALID.includes(status as typeof VALID[number])) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }

  try {
    await sql`
      UPDATE stores SET subscription_status = ${status}
      WHERE id = ${params.id}
    `
    if (status === 'CANCELLED') {
      await sql`
        UPDATE stores SET subscription_ends_at = NOW()
        WHERE id = ${params.id}
      `
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[superadmin/status]', e)
    return NextResponse.json({ error: 'Falha ao atualizar status' }, { status: 500 })
  }
}
