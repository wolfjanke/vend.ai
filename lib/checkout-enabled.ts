import type { PlanSlug } from '@/lib/plans'
import { isPlanCheckoutEligible } from '@/lib/plans'

/** Kill switch global — override de emergência. Produção: CHECKOUT_ENABLED=true */
export function isCheckoutLaunchEnabled(): boolean {
  const v = process.env.CHECKOUT_ENABLED?.trim().toLowerCase()
  return v === 'true' || v === '1'
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
