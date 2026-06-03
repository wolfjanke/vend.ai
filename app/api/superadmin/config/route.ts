import { NextRequest, NextResponse } from 'next/server'
import { requireSuperadmin } from '@/lib/superadmin'
import { getGlobalConfig, setGlobalConfig, clearGlobalConfigCache } from '@/lib/global-config'
export { dynamic } from '@/lib/route-dynamic'


export async function GET() {
  const { error } = await requireSuperadmin()
  if (error) return error

  const [plan_limits, take_rates, maintenance_mode, new_signups_enabled, support_email] =
    await Promise.all([
      getGlobalConfig('plan_limits'),
      getGlobalConfig('take_rates'),
      getGlobalConfig('maintenance_mode'),
      getGlobalConfig('new_signups_enabled'),
      getGlobalConfig('support_email'),
    ])

  return NextResponse.json({
    plan_limits,
    take_rates,
    maintenance_mode,
    new_signups_enabled,
    support_email,
  })
}

export async function PUT(req: NextRequest) {
  const { error } = await requireSuperadmin()
  if (error) return error

  const body = await req.json().catch(() => ({}))

  try {
    if (body.plan_limits != null) await setGlobalConfig('plan_limits', body.plan_limits)
    if (body.take_rates != null) await setGlobalConfig('take_rates', body.take_rates)
    if (body.maintenance_mode != null) await setGlobalConfig('maintenance_mode', body.maintenance_mode)
    if (body.new_signups_enabled != null) await setGlobalConfig('new_signups_enabled', body.new_signups_enabled)
    if (body.support_email != null) await setGlobalConfig('support_email', body.support_email)
    clearGlobalConfigCache()
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[superadmin/config]', e)
    return NextResponse.json({ error: 'Falha ao salvar' }, { status: 500 })
  }
}
