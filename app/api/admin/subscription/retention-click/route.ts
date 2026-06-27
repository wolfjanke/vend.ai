import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/require-session'
import { sql } from '@/lib/db'
import { logServerError } from '@/lib/logger'
import { isPlatformDemoStore } from '@/lib/demo-store'
import {
  buildRetentionWhatsAppUrl,
  isRetentionOfferEligible,
} from '@/lib/churn-retention'
import type { PlanSlug, SubscriptionStatus } from '@/types'
export { dynamic } from '@/lib/route-dynamic'

export async function POST() {
  const { session, unauthorized } = await requireSession()
  if (!session) return unauthorized!

  try {
    const rows = await sql`
      SELECT
        name,
        plan,
        subscription_status,
        retention_bonus_granted_at,
        retention_offer_clicked_at,
        COALESCE(is_demo, false) AS is_demo,
        slug
      FROM stores
      WHERE id = ${session.storeId}
      LIMIT 1
    `
    const store = rows[0] as {
      name: string
      plan: string
      subscription_status: string | null
      retention_bonus_granted_at: string | null
      retention_offer_clicked_at: string | null
      is_demo: boolean
      slug: string
    } | undefined

    if (!store) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })
    }

    const billingExempt = isPlatformDemoStore(store)
    const plan = store.plan as PlanSlug
    const subscriptionStatus = store.subscription_status as SubscriptionStatus | null

    if (!isRetentionOfferEligible({
      storeName: store.name,
      plan,
      subscriptionStatus,
      billingExempt,
      retentionBonusGrantedAt: store.retention_bonus_granted_at,
    })) {
      return NextResponse.json({ error: 'Oferta não disponível' }, { status: 403 })
    }

    if (!store.retention_bonus_granted_at) {
      await sql`
        UPDATE stores SET
          retention_offer_clicked_at = NOW(),
          retention_bonus_dismissed_at = NULL
        WHERE id = ${session.storeId}
      `
    }

    const whatsAppUrl = buildRetentionWhatsAppUrl({
      storeName: store.name,
      plan,
    })

    return NextResponse.json({
      ok: true,
      whatsAppUrl,
    })
  } catch (err) {
    logServerError('[POST /api/admin/subscription/retention-click]', err)
    return NextResponse.json({ error: 'Erro ao registrar interesse' }, { status: 500 })
  }
}
