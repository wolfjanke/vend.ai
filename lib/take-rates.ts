import { getGlobalConfig } from '@/lib/global-config'
import type { PlanSlug } from '@/lib/plans'

const DEFAULT_TAKE_RATES: Record<PlanSlug, number> = {
  free:       4.5,
  starter:    4.0,
  pro:        2.75,
  loja:       1.7,
  enterprise: 1.5,
}

export async function getTakeRates(): Promise<Record<PlanSlug, number>> {
  const fromDb = await getGlobalConfig<Partial<Record<PlanSlug, number>>>('take_rates')
  if (!fromDb || typeof fromDb !== 'object') return { ...DEFAULT_TAKE_RATES }
  return { ...DEFAULT_TAKE_RATES, ...fromDb }
}

export function getTakeRateSync(plan: PlanSlug, rates: Record<PlanSlug, number>): number {
  return rates[plan] ?? DEFAULT_TAKE_RATES[plan]
}
