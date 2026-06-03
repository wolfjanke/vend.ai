import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { requireSuperadmin } from '@/lib/superadmin'
import { PLAN_SLUGS, type PlanSlug } from '@/lib/plans'

type Ctx = { params: { id: string } }

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { error } = await requireSuperadmin()
  if (error) return error

  const body = await req.json().catch(() => ({}))
  const plan = body.plan as string
  if (!PLAN_SLUGS.includes(plan as PlanSlug)) {
    return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
  }

  const status = plan === 'free' ? null : (body.subscription_status ?? 'ACTIVE')

  try {
    await sql`
      UPDATE stores SET
        plan = ${plan},
        subscription_status = ${status},
        subscription_started_at = COALESCE(subscription_started_at, NOW())
      WHERE id = ${params.id}
    `
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[superadmin/plano]', e)
    return NextResponse.json({ error: 'Falha ao atualizar plano' }, { status: 500 })
  }
}
