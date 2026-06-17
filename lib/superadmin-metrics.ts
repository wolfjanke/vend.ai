import { sql } from '@/lib/db'
import { PLANS, type PlanSlug } from '@/lib/plans'
import { mrrFromPlan } from '@/lib/superadmin'

export function planPriceCents(plan: string): number {
  return mrrFromPlan(plan)
}

export async function computeTotalMrr(): Promise<number> {
  const rows = await sql`
    SELECT plan FROM stores
    WHERE subscription_status = 'ACTIVE'
      AND plan IS NOT NULL
      AND plan != 'free'
      AND COALESCE(is_demo, false) = false
  `
  return rows.reduce((sum, r) => sum + planPriceCents(r.plan as string), 0)
}

export function getViLimit(plan: string): number {
  const slug = (plan in PLANS ? plan : 'free') as PlanSlug
  return PLANS[slug].viMessagesLimit
}
