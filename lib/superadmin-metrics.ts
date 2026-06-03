import { sql } from '@/lib/db'
import { PLANS, type PlanSlug } from '@/lib/plans'
import { mrrFromPlan } from '@/lib/superadmin'

export function planPriceCents(plan: string): number {
  return mrrFromPlan(plan)
}

export async function computeTotalMrr(): Promise<number> {
  const rows = await sql`
    SELECT plan FROM stores
    WHERE subscription_status = 'ACTIVE' AND plan IS NOT NULL AND plan != 'free'
  `
  return rows.reduce((sum, r) => sum + planPriceCents(r.plan as string), 0)
}

export const PLAN_CASE_SQL = `
  CASE plan
    WHEN 'starter' THEN 4990
    WHEN 'pro' THEN 9990
    WHEN 'loja' THEN 19990
    WHEN 'enterprise' THEN 39990
    ELSE 0
  END
`

export function getViLimit(plan: string): number {
  const slug = (plan in PLANS ? plan : 'free') as PlanSlug
  return PLANS[slug].viMessagesLimit
}
