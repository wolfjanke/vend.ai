import { getGlobalConfig } from '@/lib/global-config'
import type { PlanSlug } from '@/lib/plans'
import {
  DEFAULT_FIXED_TRANSACTION_FEE,
  DEFAULT_TAKE_RATES,
  getCheckoutRates,
  type CheckoutRates,
} from '@/lib/checkout-rates'

export { DEFAULT_TAKE_RATES, DEFAULT_FIXED_TRANSACTION_FEE, getCheckoutRates }
export type { CheckoutRates }

export async function getTakeRates(): Promise<Record<PlanSlug, number>> {
  const rates = await getCheckoutRates()
  return { ...rates.takeRates }
}

export async function getFixedTransactionFee(): Promise<number> {
  const fromDb = await getGlobalConfig<number>('fixed_transaction_fee')
  if (typeof fromDb === 'number' && fromDb >= 0) return fromDb
  return DEFAULT_FIXED_TRANSACTION_FEE
}

export function getTakeRateSync(plan: PlanSlug, rates: Record<PlanSlug, number>): number {
  return rates[plan] ?? DEFAULT_TAKE_RATES[plan]
}
