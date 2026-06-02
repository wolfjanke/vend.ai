import type { InstallmentQuote } from '@/types'
import type { PlanSlug } from '@/lib/plans'
import { getWolfHubWalletId } from './config'

/** Take rate à vista (checkout) — fonte única por plano. */
export const CHECKOUT_TAKE_RATE: Record<PlanSlug, number> = {
  free:       0.045,
  starter:    0.040,
  pro:        0.0275,
  loja:       0.017,
  enterprise: 0.015,
}

export function getCheckoutTakeRate(plan: PlanSlug): number {
  return CHECKOUT_TAKE_RATE[plan] ?? CHECKOUT_TAKE_RATE.free
}

export interface AsaasSplitEntry {
  walletId: string
  percentualValue: number
}

/**
 * Monta split duplo: lojista (líquido) + Wolf Hub (take rate).
 * percentualValue deve somar 100.
 */
export function buildCheckoutSplit(
  merchantWalletId: string,
  quote: InstallmentQuote,
): AsaasSplitEntry[] {
  const hubWalletId = getWolfHubWalletId()
  if (!hubWalletId) {
    throw new Error('WOLF_HUB_WALLET_ID não configurado — split impossível')
  }
  if (!merchantWalletId) {
    throw new Error('Loja sem walletId Asaas — split impossível')
  }

  const merchantPct = round2(quote.merchantSharePct)
  const platformPct = round2(quote.platformTakePct)

  if (Math.abs(merchantPct + platformPct - 100) > 0.01) {
    throw new Error(
      `Split inválido: merchant ${merchantPct}% + platform ${platformPct}% ≠ 100%`,
    )
  }

  return [
    { walletId: merchantWalletId, percentualValue: merchantPct },
    { walletId: hubWalletId, percentualValue: platformPct },
  ]
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
