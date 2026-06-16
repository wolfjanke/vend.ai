import type { PlanSlug } from '@/lib/plans'
import { isPlanCheckoutEligible, PLAN_SLUGS, PLANS } from '@/lib/plans'

/** Flag de ambiente — só liga checkout se algum plano tiver `checkoutEnabled: true`. */
export function isCheckoutEnvEnabled(): boolean {
  const v = process.env.CHECKOUT_ENABLED?.trim().toLowerCase()
  return v === 'true' || v === '1'
}

/** Algum plano com checkout integrado habilitado na definição de planos. */
export function hasCheckoutEligiblePlans(): boolean {
  return PLAN_SLUGS.some(slug => PLANS[slug].checkoutEnabled)
}

/** Checkout integrado da loja disponível no produto (env + planos). */
export function isCheckoutLaunchEnabled(): boolean {
  return isCheckoutEnvEnabled() && hasCheckoutEligiblePlans()
}

export type CheckoutStoreInput = {
  plan: string
  asaas_onboarding_status?: string | null
  asaas_wallet_id?: string | null
  is_demo?: boolean | null
}

/** Elegibilidade técnica: plano pago + subconta aprovada + kill switch on. */
export function isCheckoutEnabledForStore(store: CheckoutStoreInput): boolean {
  if (store.is_demo === true) return false
  if (!isPlanCheckoutEligible(store.plan as PlanSlug)) return false
  if (!isCheckoutLaunchEnabled()) return false
  return store.asaas_onboarding_status === 'APPROVED' && !!store.asaas_wallet_id
}
