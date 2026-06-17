import { sql } from '@/lib/db'
import { addDaysBr, formatDateYmdBr, firstChargeInstantFromYmd } from '@/lib/billing-dates'
import { syncAsaasSubscriptionNextDueDate } from '@/lib/payments/subscriptions'
import { getVendaiAsaasKey } from '@/lib/payments/config'
import { RETENTION_BONUS_DAYS } from '@/lib/churn-retention'
import type { SubscriptionStatus } from '@/types'

export class RetentionGrantError extends Error {
  constructor(
    message: string,
    public readonly code: 'NOT_FOUND' | 'ALREADY_GRANTED' | 'NO_CLICK' | 'NOT_ELIGIBLE',
  ) {
    super(message)
    this.name = 'RetentionGrantError'
  }
}

function extensionBase(existingIso: string | null | undefined, now: Date): Date {
  if (existingIso) {
    const existing = new Date(existingIso)
    if (existing.getTime() > now.getTime()) return existing
  }
  return now
}

export interface RetentionGrantResult {
  bonusDays: number
  trialEndsAt: string | null
  subscriptionEndsAt: string
  nextDueDate: string
}

export async function grantRetentionBonus(
  storeId: string,
  grantedByEmail: string,
): Promise<RetentionGrantResult> {
  const rows = await sql`
    SELECT
      plan,
      subscription_status,
      trial_ends_at,
      subscription_ends_at,
      asaas_subscription_id,
      retention_bonus_granted_at,
      retention_offer_clicked_at,
      COALESCE(is_demo, false) AS is_demo
    FROM stores
    WHERE id = ${storeId}
    LIMIT 1
  `
  const store = rows[0] as {
    plan: string
    subscription_status: string | null
    trial_ends_at: string | null
    subscription_ends_at: string | null
    asaas_subscription_id: string | null
    retention_bonus_granted_at: string | null
    retention_offer_clicked_at: string | null
    is_demo: boolean
  } | undefined

  if (!store) throw new RetentionGrantError('Loja não encontrada', 'NOT_FOUND')
  if (store.is_demo) throw new RetentionGrantError('Loja demo não elegível', 'NOT_ELIGIBLE')
  if (store.retention_bonus_granted_at) {
    throw new RetentionGrantError('Bônus de retenção já concedido', 'ALREADY_GRANTED')
  }
  if (!store.retention_offer_clicked_at) {
    throw new RetentionGrantError('Lojista não clicou na oferta de retenção', 'NO_CLICK')
  }
  if (store.plan === 'free' || store.subscription_status === 'CANCELLED') {
    throw new RetentionGrantError('Assinatura não está ativa', 'NOT_ELIGIBLE')
  }

  const status = store.subscription_status as SubscriptionStatus | null
  const now = new Date()
  const bonusDays = RETENTION_BONUS_DAYS

  let newTrialEnds: Date | null = null
  let newSubscriptionEnds: Date

  if (status === 'TRIAL') {
    const base = extensionBase(store.trial_ends_at, now)
    newTrialEnds = addDaysBr(base, bonusDays)
    newSubscriptionEnds = newTrialEnds
  } else {
    const base = extensionBase(store.subscription_ends_at ?? store.trial_ends_at, now)
    newSubscriptionEnds = addDaysBr(base, bonusDays)
    if (store.trial_ends_at && new Date(store.trial_ends_at) > now) {
      newTrialEnds = addDaysBr(new Date(store.trial_ends_at), bonusDays)
    }
  }

  const chargeDate = newTrialEnds ?? newSubscriptionEnds
  const nextDueYmd = formatDateYmdBr(chargeDate)
  const endsIso = firstChargeInstantFromYmd(nextDueYmd).toISOString()

  if (store.asaas_subscription_id && getVendaiAsaasKey()) {
    await syncAsaasSubscriptionNextDueDate(store.asaas_subscription_id, chargeDate)
  }

  if (status === 'TRIAL' && newTrialEnds) {
    await sql`
      UPDATE stores SET
        trial_ends_at = ${endsIso},
        subscription_ends_at = ${endsIso},
        subscription_status = 'TRIAL',
        retention_bonus_granted_at = NOW(),
        retention_bonus_granted_by = ${grantedByEmail},
        retention_bonus_dismissed_at = NULL
      WHERE id = ${storeId}
    `
  } else {
    const reactivate = status === 'OVERDUE'
    await sql`
      UPDATE stores SET
        subscription_ends_at = ${endsIso},
        subscription_status = ${reactivate ? 'ACTIVE' : status},
        trial_ends_at = ${newTrialEnds ? firstChargeInstantFromYmd(formatDateYmdBr(newTrialEnds)).toISOString() : store.trial_ends_at},
        retention_bonus_granted_at = NOW(),
        retention_bonus_granted_by = ${grantedByEmail},
        retention_bonus_dismissed_at = NULL
      WHERE id = ${storeId}
    `
  }

  await sql`
    INSERT INTO billing_history (store_id, type, plan, amount_cents, description)
    VALUES (
      ${storeId},
      'RETENTION_BONUS',
      ${store.plan},
      0,
      ${`Bônus retenção +${bonusDays} dias (aprovado por ${grantedByEmail})`}
    )
  `

  return {
    bonusDays,
    trialEndsAt: status === 'TRIAL' ? endsIso : newTrialEnds?.toISOString() ?? null,
    subscriptionEndsAt: endsIso,
    nextDueDate: nextDueYmd,
  }
}

/** Soma dias ao trial/assinatura existente (superadmin genérico). */
export async function extendStoreTrialDays(
  storeId: string,
  days: number,
): Promise<{ trialEndsAt: string; nextDueDate: string }> {
  const rows = await sql`
    SELECT trial_ends_at, subscription_ends_at, asaas_subscription_id, subscription_status
    FROM stores WHERE id = ${storeId} LIMIT 1
  `
  const store = rows[0] as {
    trial_ends_at: string | null
    subscription_ends_at: string | null
    asaas_subscription_id: string | null
    subscription_status: string | null
  } | undefined
  if (!store) throw new Error('Loja não encontrada')

  const now = new Date()
  const base = extensionBase(store.trial_ends_at ?? store.subscription_ends_at, now)
  const trialEnds = addDaysBr(base, days)
  const nextDueYmd = formatDateYmdBr(trialEnds)
  const trialEndsIso = firstChargeInstantFromYmd(nextDueYmd).toISOString()

  if (store.asaas_subscription_id && getVendaiAsaasKey()) {
    await syncAsaasSubscriptionNextDueDate(store.asaas_subscription_id, trialEnds)
  }

  await sql`
    UPDATE stores SET
      trial_ends_at = ${trialEndsIso},
      subscription_status = 'TRIAL',
      subscription_ends_at = ${trialEndsIso}
    WHERE id = ${storeId}
  `

  return { trialEndsAt: trialEndsIso, nextDueDate: nextDueYmd }
}
