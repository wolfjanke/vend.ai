import { NextRequest, NextResponse } from 'next/server'
import { requireSuperadmin } from '@/lib/superadmin'
import { extendStoreTrialDays } from '@/lib/retention-grant'
export { dynamic } from '@/lib/route-dynamic'

type Ctx = { params: { id: string } }

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { error } = await requireSuperadmin()
  if (error) return error

  const body = await req.json().catch(() => ({}))
  const days = Math.min(90, Math.max(1, Number(body.days) || 7))

  try {
    const result = await extendStoreTrialDays(params.id, days)
    return NextResponse.json({ ok: true, days, ...result })
  } catch (e) {
    console.error('[superadmin/trial]', e)
    return NextResponse.json({ error: 'Falha ao estender trial' }, { status: 500 })
  }
}
