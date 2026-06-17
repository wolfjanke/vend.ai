import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionSafe } from '@/lib/auth'
import { sql } from '@/lib/db'
import { logServerError } from '@/lib/logger'
import { AsaasApiError, paymentsNotConfiguredMessage } from '@/lib/payments/wolf-hub'
import { getVendaiAsaasKey } from '@/lib/payments/config'
import { assertBillingTestAllowed, isBillingTestAllowedForStore } from '@/lib/billing-test-access'
import {
  cancelSubscription,
  createSubscription,
  getSubscriptionStatus,
  upgradeSubscription,
} from '@/lib/payments/subscriptions'
import { PLAN_PRODUCT_LIMITS, PLANS, PAID_PLAN_SLUGS, getChargeAmountCents, getDisplayMonthlyCents, type PlanSlug, type BillingCycle } from '@/lib/plans'
import { getTrialDaysForPlan } from '@/lib/billing-trial'
import { sendUpgradeEmail } from '@/lib/email/send-upgrade'
import { isPlatformDemoStore } from '@/lib/demo-store'
import { getStorePlanContext } from '@/lib/store-plan-access'
import { saveBillingOwner } from '@/lib/billing-owner'
import { billingOwnerSchema } from '@/lib/validations'

export { dynamic } from '@/lib/route-dynamic'

const postSchema = z.object({
  plan: z.enum(['starter', 'pro', 'loja', 'enterprise']),
  action: z.enum(['create', 'upgrade']).optional(),
  billingCycle: z.enum(['monthly', 'quarterly', 'annual']).default('monthly'),
  billing: billingOwnerSchema.optional(),
})

export async function GET() {
  const session = await getSessionSafe()
  if (!session?.storeId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const sub = await getSubscriptionStatus(session.storeId)

    const productRows = await sql`
      SELECT COUNT(*)::int AS c FROM products
      WHERE store_id = ${session.storeId} AND active = true
    `
    const storeRows = await sql`
      SELECT vi_messages_used, vi_messages_reset_at, vi_overage_messages, is_demo, slug, plan
      FROM stores WHERE id = ${session.storeId} LIMIT 1
    `
    const store = storeRows[0] as {
      vi_messages_used: number
      vi_overage_messages: number
      is_demo?: boolean
      slug?: string
      plan?: string
    } | undefined

    const planCtx = getStorePlanContext({
      plan: sub.plan,
      is_demo: store?.is_demo,
      slug: store?.slug,
    })
    const productCount = Number(productRows[0]?.c ?? 0)
    const productLimit = planCtx.productLimit
    const viLimit = planCtx.viMessagesLimit

    let history: unknown[] = []
    try {
      history = await sql`
        SELECT id, type, plan, amount_cents, description, created_at
        FROM billing_history
        WHERE store_id = ${session.storeId}
        ORDER BY created_at DESC
        LIMIT 20
      `
    } catch {
      history = []
    }

    return NextResponse.json({
      ...sub,
      isDemoStore: planCtx.isDemo,
      billingExempt: planCtx.billingExempt,
      paymentsConfigured: !!getVendaiAsaasKey(),
      billingTestAllowed: await isBillingTestAllowedForStore(session.storeId),
      usage: {
        productCount,
        productLimit,
        viMessagesUsed: Number(store?.vi_messages_used ?? 0),
        viMessagesLimit: viLimit,
        viOverageMessages: Number(store?.vi_overage_messages ?? 0),
      },
      plans: PAID_PLAN_SLUGS.map(slug => ({
        slug,
        name: PLANS[slug].name,
        priceCents: PLANS[slug].price,
        trialDays: getTrialDaysForPlan(slug),
        billing: (['monthly', 'quarterly', 'annual'] as const).reduce((acc, cycle) => {
          acc[cycle] = {
            displayMonthlyCents: getDisplayMonthlyCents(slug, cycle),
            chargeAmountCents: getChargeAmountCents(slug, cycle),
          }
          return acc
        }, {} as Record<BillingCycle, { displayMonthlyCents: number; chargeAmountCents: number }>),
      })),
      billingHistory: history,
    })
  } catch (err) {
    logServerError('[GET /api/admin/subscription]', err)
    return NextResponse.json({ error: 'Erro ao carregar assinatura' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionSafe()
  if (!session?.storeId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const demoRows = await sql`SELECT is_demo, slug FROM stores WHERE id = ${session.storeId} LIMIT 1`
  if (isPlatformDemoStore(demoRows[0] ?? {})) {
    return NextResponse.json(
      { error: 'A loja de demonstração não possui assinatura paga.' },
      { status: 403 },
    )
  }

  if (!getVendaiAsaasKey()) {
    return NextResponse.json(
      { error: paymentsNotConfiguredMessage() },
      { status: 503 },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 422 })
  }

  const { plan, action, billingCycle, billing } = parsed.data

  try {
    await assertBillingTestAllowed(session.storeId)

    if (billing) {
      await saveBillingOwner(session.storeId, billing)
    }

    const before = await getSubscriptionStatus(session.storeId)
    const oldPlan = before.plan

    if (action === 'upgrade') {
      await upgradeSubscription(session.storeId, plan as PlanSlug, billingCycle)
    } else {
      await createSubscription(session.storeId, plan as PlanSlug, billingCycle)
    }
    const status = await getSubscriptionStatus(session.storeId)

    if (oldPlan !== plan) {
      const storeRows = await sql`
        SELECT s.name, u.email AS owner_email
        FROM stores s
        LEFT JOIN admin_users u ON u.store_id = s.id
        WHERE s.id = ${session.storeId}
        LIMIT 1
      `
      const row = storeRows[0] as { name: string; owner_email: string | null } | undefined
      if (row?.owner_email) {
        const trialDays = getTrialDaysForPlan(plan as PlanSlug)
        void sendUpgradeEmail({
          ownerName: row.name,
          ownerEmail: row.owner_email,
          storeName: row.name,
          oldPlan,
          newPlan: plan,
          billingCycle,
          subscriptionStatus: status.subscriptionStatus,
          trialDaysRemaining: status.trialDaysRemaining,
          nextChargeAt: status.nextChargeAt,
          trialDays: status.subscriptionStatus === 'TRIAL' ? trialDays : 0,
        }).catch(err => logServerError('[Email] Falha no upgrade', err))
      }
    }

    return NextResponse.json({ ok: true, ...status })
  } catch (err) {
    if (err instanceof AsaasApiError) {
      return NextResponse.json({ error: err.description }, { status: 502 })
    }
    logServerError('[POST /api/admin/subscription]', err)
    const msg = err instanceof Error ? err.message : 'Erro ao criar assinatura'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE() {
  const session = await getSessionSafe()
  if (!session?.storeId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    await assertBillingTestAllowed(session.storeId)
    await cancelSubscription(session.storeId)
    const status = await getSubscriptionStatus(session.storeId)
    return NextResponse.json({ ok: true, ...status })
  } catch (err) {
    logServerError('[DELETE /api/admin/subscription]', err)
    return NextResponse.json({ error: 'Erro ao cancelar assinatura' }, { status: 500 })
  }
}
