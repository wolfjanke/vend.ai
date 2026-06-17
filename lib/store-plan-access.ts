import {
  PLANS,
  PLAN_PRODUCT_LIMITS,
  canUseAssistantFeature,
  canUsePhotoAnalysis,
  type AssistantFeature,
  type PlanSlug,
} from '@/lib/plans'
import { canUsePdv } from '@/lib/pdv-access'
import { DEMO_EFFECTIVE_PLAN, isPlatformDemoStore } from '@/lib/demo-store'

export type StorePlanRow = {
  plan?:          string | null
  is_demo?:       boolean | null
  slug?:          string | null
}

export function getStorePlanContext(store: StorePlanRow) {
  const isDemo = isPlatformDemoStore(store)
  const plan = (isDemo ? DEMO_EFFECTIVE_PLAN : (store.plan ?? 'free')) as PlanSlug
  const planDef = PLANS[plan]

  return {
    isDemo,
    plan,
    billingExempt: isDemo,
    productLimit: isDemo ? null : PLAN_PRODUCT_LIMITS[plan],
    viMessagesLimit: isDemo ? 1_000_000 : planDef.viMessagesLimit,
    photoAnalysisUnlimited: isDemo,
    pdvEnabled: isDemo || canUsePdv(plan),
  }
}

export function canUsePdvForStore(store: StorePlanRow): boolean {
  return getStorePlanContext(store).pdvEnabled
}

export function canUsePhotoAnalysisForStore(store: StorePlanRow): boolean {
  if (isPlatformDemoStore(store)) return true
  return canUsePhotoAnalysis((store.plan ?? 'free') as PlanSlug)
}

export function canUseAssistantFeatureForStore(
  store: StorePlanRow,
  feature: AssistantFeature,
): boolean {
  if (isPlatformDemoStore(store)) return true
  return canUseAssistantFeature(store.plan ?? 'free', feature)
}

/** Use em queries superadmin: `AND COALESCE(alias.is_demo, false) = false` */
export const SUPERADMIN_EXCLUDE_DEMO_SQL = 'COALESCE(is_demo, false) = false'
