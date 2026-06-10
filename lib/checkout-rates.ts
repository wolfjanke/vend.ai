import { getGlobalConfig } from '@/lib/global-config'
import type { PlanSlug } from '@/lib/plans'

export type FaixaKey = '1-3' | '4-6' | '7-9' | '10-12'

export interface CheckoutRates {
  /** Percentual humano por plano (ex.: 3.9 = 3,9%) */
  takeRates: Record<PlanSlug, number>
  /** Taxa fixa por transação em reais (ex.: 0.99) */
  fixedFee: number
  /** Taxa decimal por faixa de parcelas (juros embutidos quando repassados ao cliente) */
  installmentFaixas: Record<PlanSlug, Record<FaixaKey, number>>
}

export const DEFAULT_TAKE_RATES: Record<PlanSlug, number> = {
  free:       3.9,
  starter:    3.5,
  pro:        2.75,
  loja:       1.7,
  enterprise: 1.5,
}

export const DEFAULT_FIXED_TRANSACTION_FEE = 0.99

const DEFAULT_INSTALLMENT_FAIXAS: Record<PlanSlug, Record<FaixaKey, number>> = {
  free:       { '1-3': 0.039, '4-6': 0.079, '7-9': 0.119, '10-12': 0.159 },
  starter:    { '1-3': 0.035, '4-6': 0.070, '7-9': 0.105, '10-12': 0.140 },
  pro:        { '1-3': 0.036, '4-6': 0.065, '7-9': 0.095, '10-12': 0.125 },
  loja:       { '1-3': 0.035, '4-6': 0.055, '7-9': 0.080, '10-12': 0.105 },
  enterprise: { '1-3': 0.033, '4-6': 0.050, '7-9': 0.075, '10-12': 0.100 },
}

export const DEFAULT_CHECKOUT_RATES: CheckoutRates = {
  takeRates:         { ...DEFAULT_TAKE_RATES },
  fixedFee:          DEFAULT_FIXED_TRANSACTION_FEE,
  installmentFaixas: structuredClone(DEFAULT_INSTALLMENT_FAIXAS),
}

/** Take rate à vista como fração decimal (ex.: 0.039) */
export function takeRateFraction(plan: PlanSlug, rates: CheckoutRates): number {
  return (rates.takeRates[plan] ?? DEFAULT_TAKE_RATES[plan]) / 100
}

export async function getCheckoutRates(): Promise<CheckoutRates> {
  const [takeFromDb, fixedFromDb] = await Promise.all([
    getGlobalConfig<Partial<Record<PlanSlug, number>>>('take_rates'),
    getGlobalConfig<number>('fixed_transaction_fee'),
  ])

  const takeRates = { ...DEFAULT_TAKE_RATES }
  if (takeFromDb && typeof takeFromDb === 'object') {
    for (const plan of Object.keys(DEFAULT_TAKE_RATES) as PlanSlug[]) {
      if (typeof takeFromDb[plan] === 'number') takeRates[plan] = takeFromDb[plan]!
    }
  }

  const fixedFee =
    typeof fixedFromDb === 'number' && fixedFromDb >= 0
      ? fixedFromDb
      : DEFAULT_FIXED_TRANSACTION_FEE

  return {
    takeRates,
    fixedFee,
    installmentFaixas: structuredClone(DEFAULT_INSTALLMENT_FAIXAS),
  }
}
