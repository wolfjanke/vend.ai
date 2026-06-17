import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { requireSuperadmin } from '@/lib/superadmin'
import { logServerError } from '@/lib/logger'
import { grantRetentionBonus, RetentionGrantError } from '@/lib/retention-grant'
export { dynamic } from '@/lib/route-dynamic'

type Ctx = { params: { storeId: string } | Promise<{ storeId: string }> }

export async function POST(_req: Request, { params }: Ctx) {
  const { session, error } = await requireSuperadmin()
  if (error) return error

  const { storeId } = await params
  const grantedBy = session?.user?.email ?? 'superadmin'

  try {
    const result = await grantRetentionBonus(storeId, grantedBy)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    if (err instanceof RetentionGrantError) {
      const status =
        err.code === 'NOT_FOUND' ? 404
        : err.code === 'ALREADY_GRANTED' || err.code === 'NO_CLICK' || err.code === 'NOT_ELIGIBLE'
          ? 409
          : 400
      return NextResponse.json({ error: err.message, code: err.code }, { status })
    }
    logServerError('[POST /api/superadmin/retencao/grant]', err)
    return NextResponse.json({ error: 'Falha ao conceder bônus' }, { status: 500 })
  }
}
