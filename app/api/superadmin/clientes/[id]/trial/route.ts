import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { requireSuperadmin } from '@/lib/superadmin'
import { addDaysBr, formatDateYmdBr, firstChargeInstantFromYmd } from '@/lib/billing-dates'
import { syncAsaasSubscriptionNextDueDate } from '@/lib/payments/subscriptions'
import { getVendaiAsaasKey } from '@/lib/payments/config'
export { dynamic } from '@/lib/route-dynamic'


type Ctx = { params: { id: string } }

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { error } = await requireSuperadmin()
  if (error) return error

  const body = await req.json().catch(() => ({}))
  const days = Math.min(90, Math.max(1, Number(body.days) || 7))

  try {
    const rows = await sql`
      SELECT asaas_subscription_id FROM stores WHERE id = ${params.id} LIMIT 1
    `
    const asaasSubId = (rows[0] as { asaas_subscription_id?: string | null } | undefined)?.asaas_subscription_id

    const trialEnds = addDaysBr(new Date(), days)
    const nextDueYmd = formatDateYmdBr(trialEnds)
    const trialEndsIso = firstChargeInstantFromYmd(nextDueYmd).toISOString()

    if (asaasSubId && getVendaiAsaasKey()) {
      await syncAsaasSubscriptionNextDueDate(asaasSubId, trialEnds)
    }

    await sql`
      UPDATE stores SET
        trial_ends_at = ${trialEndsIso},
        subscription_status = 'TRIAL',
        subscription_ends_at = ${trialEndsIso}
      WHERE id = ${params.id}
    `
    return NextResponse.json({ ok: true, days, trialEndsAt: trialEndsIso, nextDueDate: nextDueYmd })
  } catch (e) {
    console.error('[superadmin/trial]', e)
    return NextResponse.json({ error: 'Falha ao estender trial' }, { status: 500 })
  }
}
