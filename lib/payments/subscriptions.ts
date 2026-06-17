import { sql } from '@/lib/db'
import { isPlatformDemoStore } from '@/lib/demo-store'
import {
  getPlan,
  TRIAL_DAYS_BY_PLAN,
  isPaidPlan,
  getChargeAmountCents,
  getBillingPeriodDays,
  type PlanSlug,
  type BillingCycle,
} from '@/lib/plans'
import { getVendaiAsaasKey, assertPaymentsConfigured } from './config'
import {
  createCustomer,
  createPayment,
  asaasCreateSubscription,
  cancelSubscriptionAsaas,
  updateCustomer,
} from './wolf-hub'
import {
  BILLING_DOC_REQUIRED_MSG,
  buildAsaasCustomerPayload,
} from '@/lib/billing-owner'
import type { SubscriptionStatus } from '@/types'

const ASAAS_CYCLE = {
  monthly:   'MONTHLY',
  quarterly: 'QUARTERLY',
  annual:    'YEARLY',
} as const

function formatDateYmd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d)
  out.setUTCDate(out.getUTCDate() + days)
  return out
}

async function loadStoreBilling(storeId: string) {
  const rows = await sql`
    SELECT
      s.id, s.name, s.plan,
      s.asaas_subscription_id,
      s.asaas_billing_customer_id,
      s.subscription_status,
      s.subscription_started_at,
      s.subscription_ends_at,
      s.trial_ends_at,
      s.billing_cycle,
      s.vi_overage_messages,
      u.email AS owner_email
    FROM stores s
    LEFT JOIN admin_users u ON u.store_id = s.id
    WHERE s.id = ${storeId}
    LIMIT 1
  `
  return rows[0] as {
    id: string
    name: string
    plan: string
    asaas_subscription_id: string | null
    asaas_billing_customer_id: string | null
    subscription_status: string | null
    subscription_started_at: string | null
    subscription_ends_at: string | null
    trial_ends_at: string | null
    billing_cycle: string | null
    vi_overage_messages: number
    owner_email: string | null
  } | undefined
}

export async function ensureBillingCustomer(storeId: string): Promise<string> {
  const store = await loadStoreBilling(storeId)
  if (!store) throw new Error('Loja não encontrada')

  const payload = await buildAsaasCustomerPayload(storeId)
  if (!payload?.cpfCnpj) {
    throw new Error(BILLING_DOC_REQUIRED_MSG)
  }

  assertPaymentsConfigured()

  if (store.asaas_billing_customer_id) {
    await updateCustomer(store.asaas_billing_customer_id, payload)
    return store.asaas_billing_customer_id
  }

  const customer = await createCustomer(payload)

  await sql`
    UPDATE stores SET asaas_billing_customer_id = ${customer.id}
    WHERE id = ${storeId}
  `

  return customer.id
}

export interface SubscriptionStatusResult {
  plan: PlanSlug
  subscriptionStatus: SubscriptionStatus | null
  subscriptionStartedAt: string | null
  subscriptionEndsAt: string | null
  trialEndsAt: string | null
  asaasSubscriptionId: string | null
  trialDaysRemaining: number | null
  billingCycle: BillingCycle
}

export async function getSubscriptionStatus(storeId: string): Promise<SubscriptionStatusResult> {
  const store = await loadStoreBilling(storeId)
  const plan = (store?.plan ?? 'free') as PlanSlug
  const billingCycle = (store?.billing_cycle ?? 'monthly') as BillingCycle
  const trialEnds = store?.trial_ends_at ?? null
  let trialDaysRemaining: number | null = null
  if (trialEnds && store?.subscription_status === 'TRIAL') {
    const diff = new Date(trialEnds).getTime() - Date.now()
    trialDaysRemaining = Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)))
  }

  return {
    plan,
    subscriptionStatus: (store?.subscription_status as SubscriptionStatus) ?? null,
    subscriptionStartedAt: store?.subscription_started_at ?? null,
    subscriptionEndsAt: store?.subscription_ends_at ?? null,
    trialEndsAt: trialEnds,
    asaasSubscriptionId: store?.asaas_subscription_id ?? null,
    trialDaysRemaining,
    billingCycle,
  }
}

export async function createSubscription(
  storeId: string,
  planSlug: PlanSlug,
  billingCycle: BillingCycle = 'monthly',
): Promise<void> {
  if (!isPaidPlan(planSlug)) {
    throw new Error('Plano inválido para assinatura')
  }

  const demoRows = await sql`SELECT is_demo, slug FROM stores WHERE id = ${storeId} LIMIT 1`
  if (isPlatformDemoStore(demoRows[0] ?? {})) {
    throw new Error('Loja de demonstração não pode ter assinatura paga')
  }

  if (!getVendaiAsaasKey()) {
    throw new Error('VENDAI_ASAAS_KEY não configurada')
  }

  const existing = await loadStoreBilling(storeId)
  if (existing?.asaas_subscription_id) {
    try {
      await cancelSubscriptionAsaas(existing.asaas_subscription_id)
    } catch {
      /* assinatura anterior pode já estar cancelada */
    }
  }

  const customerId = await ensureBillingCustomer(storeId)
  const planDef = getPlan(planSlug)
  const chargeCents = getChargeAmountCents(planSlug, billingCycle)
  const valueReais = chargeCents / 100
  const trialDays = TRIAL_DAYS_BY_PLAN[planSlug] ?? 0
  const now = new Date()
  const trialEnds = trialDays > 0 ? addDays(now, trialDays) : null
  const nextDueDate = trialEnds ? formatDateYmd(trialEnds) : formatDateYmd(addDays(now, 1))

  const sub = await asaasCreateSubscription({
    customer: customerId,
    billingType: 'UNDEFINED',
    value: valueReais,
    nextDueDate,
    cycle: ASAAS_CYCLE[billingCycle],
    description: `Assinatura ${planDef.name} (${billingCycle}) — vendai.club`,
    externalReference: storeId,
  })

  const status: SubscriptionStatus = trialDays > 0 ? 'TRIAL' : 'ACTIVE'
  const endsAt = addDays(now, getBillingPeriodDays(billingCycle))

  await sql`
    UPDATE stores SET
      plan = ${planSlug},
      billing_cycle = ${billingCycle},
      asaas_subscription_id = ${sub.id},
      subscription_status = ${status},
      subscription_started_at = NOW(),
      subscription_ends_at = ${endsAt.toISOString()},
      trial_ends_at = ${trialEnds ? trialEnds.toISOString() : null}
    WHERE id = ${storeId}
  `

  await sql`
    INSERT INTO billing_history (store_id, type, plan, amount_cents, description)
    VALUES (
      ${storeId},
      'SUBSCRIPTION_CREATED',
      ${planSlug},
      ${chargeCents},
      ${`Assinatura ${planDef.name} criada (${billingCycle})`}
    )
  `
}

export async function cancelSubscription(storeId: string): Promise<void> {
  const store = await loadStoreBilling(storeId)
  if (!store) throw new Error('Loja não encontrada')

  if (store.asaas_subscription_id && getVendaiAsaasKey()) {
    try {
      await cancelSubscriptionAsaas(store.asaas_subscription_id)
    } catch {
      /* ignore */
    }
  }

  await sql`
    UPDATE stores SET
      plan = 'free',
      billing_cycle = 'monthly',
      asaas_subscription_id = NULL,
      subscription_status = 'CANCELLED',
      subscription_ends_at = NULL,
      trial_ends_at = NULL
    WHERE id = ${storeId}
  `
}

export async function upgradeSubscription(
  storeId: string,
  newPlan: PlanSlug,
  billingCycle: BillingCycle = 'monthly',
): Promise<void> {
  await createSubscription(storeId, newPlan, billingCycle)
}

/** Cobrança avulsa do excedente de mensagens Vi no mês. */
export async function chargeViOverage(storeId: string): Promise<{ charged: boolean; amountCents: number }> {
  const store = await loadStoreBilling(storeId)
  if (!store) throw new Error('Loja não encontrada')

  const plan = (store.plan ?? 'free') as PlanSlug
  const overage = Number(store.vi_overage_messages ?? 0)
  if (overage <= 0) return { charged: false, amountCents: 0 }

  const planDef = getPlan(plan)
  if (!planDef.overage) return { charged: false, amountCents: 0 }

  const blocks = Math.ceil(overage / planDef.overage.per)
  const amountCents = blocks * planDef.overage.price
  if (amountCents <= 0) return { charged: false, amountCents: 0 }

  if (!getVendaiAsaasKey()) {
    throw new Error('VENDAI_ASAAS_KEY não configurada')
  }

  const customerId = await ensureBillingCustomer(storeId)
  const valueReais = amountCents / 100

  const payment = await createPayment({
    customer: customerId,
    billingType: 'UNDEFINED',
    value: valueReais,
    dueDate: formatDateYmd(addDays(new Date(), 3)),
    description: `Excedente Vi — ${overage.toLocaleString('pt-BR')} mensagens (${plan})`,
    externalReference: `${storeId}:vi-overage`,
  })

  await sql`
    UPDATE stores SET vi_overage_messages = 0 WHERE id = ${storeId}
  `

  await sql`
    INSERT INTO billing_history (store_id, type, plan, amount_cents, asaas_payment_id, description)
    VALUES (
      ${storeId},
      'VI_OVERAGE',
      ${plan},
      ${amountCents},
      ${payment.id},
      ${`Excedente ${overage} mensagens Vi`}
    )
  `

  return { charged: true, amountCents }
}
