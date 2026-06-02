import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionSafe } from '@/lib/auth'
import { sql } from '@/lib/db'
import { logServerError } from '@/lib/logger'
import { AsaasApiError, paymentsNotConfiguredMessage } from '@/lib/payments/wolf-hub'
import { getWolfHubApiKey } from '@/lib/payments/config'
import {
  cancelSubscription,
  createSubscription,
  getSubscriptionStatus,
  upgradeSubscription,
} from '@/lib/payments/subscriptions'
import { PLAN_PRODUCT_LIMITS, PLANS, PAID_PLAN_SLUGS, type PlanSlug } from '@/lib/plans'
import { sendUpgradeEmail } from '@/lib/email/send-upgrade'

const postSchema = z.object({
  plan: z.enum(['starter', 'pro', 'loja', 'enterprise']),
  action: z.enum(['create', 'upgrade']).optional(),
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
      SELECT vi_messages_used, vi_messages_reset_at, vi_overage_messages
      FROM stores WHERE id = ${session.storeId} LIMIT 1
    `
    const store = storeRows[0] as {
      vi_messages_used: number
      vi_overage_messages: number
    } | undefined

    const plan = sub.plan
    const productCount = Number(productRows[0]?.c ?? 0)
    const productLimit = PLAN_PRODUCT_LIMITS[plan]
    const viLimit = PLANS[plan].viMessagesLimit

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
      paymentsConfigured: !!getWolfHubApiKey(),
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

  if (!getWolfHubApiKey()) {
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

  const { plan, action } = parsed.data

  try {
    const before = await getSubscriptionStatus(session.storeId)
    const oldPlan = before.plan

    if (action === 'upgrade') {
      await upgradeSubscription(session.storeId, plan as PlanSlug)
    } else {
      await createSubscription(session.storeId, plan as PlanSlug)
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
        void sendUpgradeEmail({
          ownerName: row.name,
          ownerEmail: row.owner_email,
          storeName: row.name,
          oldPlan,
          newPlan: plan,
          renewalDay: new Date().getDate(),
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
    await cancelSubscription(session.storeId)
    const status = await getSubscriptionStatus(session.storeId)
    return NextResponse.json({ ok: true, ...status })
  } catch (err) {
    logServerError('[DELETE /api/admin/subscription]', err)
    return NextResponse.json({ error: 'Erro ao cancelar assinatura' }, { status: 500 })
  }
}
