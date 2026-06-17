import { sql } from '@/lib/db'
import { TRIAL_DAYS_BY_PLAN, type PlanSlug } from '@/lib/plans'
import type { SubscriptionStatus } from '@/types'

export function getTrialDaysForPlan(plan: PlanSlug): number {
  return TRIAL_DAYS_BY_PLAN[plan] ?? 0
}

export function isTrialStillActive(trialEndsAt: string | null | undefined): boolean {
  if (!trialEndsAt) return false
  return new Date(trialEndsAt).getTime() > Date.now()
}

/** Trial completo só na 1ª assinatura paga (sem histórico SUBSCRIPTION_CREATED). */
export async function isFirstPaidSubscription(storeId: string): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM billing_history
    WHERE store_id = ${storeId} AND type = 'SUBSCRIPTION_CREATED'
    LIMIT 1
  `
  return rows.length === 0
}

export interface ResolveTrialInput {
  planSlug:           PlanSlug
  isFirstPaid:        boolean
  subscriptionStatus: SubscriptionStatus | null | undefined
  trialEndsAt:        string | null | undefined
}

/**
 * - Upgrade durante trial ativo: mantém trial_ends_at.
 * - 1ª assinatura paga: aplica dias do plano.
 * - Demais casos: sem trial.
 */
export function resolveTrialDays(input: ResolveTrialInput): number {
  if (
    input.subscriptionStatus === 'TRIAL' &&
    isTrialStillActive(input.trialEndsAt)
  ) {
    return 0
  }
  if (!input.isFirstPaid) return 0
  return getTrialDaysForPlan(input.planSlug)
}

export function preservedTrialEnd(input: ResolveTrialInput): Date | null {
  if (
    input.subscriptionStatus === 'TRIAL' &&
    isTrialStillActive(input.trialEndsAt) &&
    input.trialEndsAt
  ) {
    return new Date(input.trialEndsAt)
  }
  return null
}
