import type { InstallmentQuote } from '@/types'
import type { PlanSlug } from '@/lib/plans'
import { getVendaiAsaasWalletId } from './config'
import { DEFAULT_TAKE_RATES, takeRateFraction, type CheckoutRates } from '@/lib/checkout-rates'

/** Take rate à vista (fração decimal) — fallback quando rates não injetados. */
export const CHECKOUT_TAKE_RATE: Record<PlanSlug, number> = {
  free:       DEFAULT_TAKE_RATES.free / 100,
  starter:    DEFAULT_TAKE_RATES.starter / 100,
  pro:        DEFAULT_TAKE_RATES.pro / 100,
  loja:       DEFAULT_TAKE_RATES.loja / 100,
  enterprise: DEFAULT_TAKE_RATES.enterprise / 100,
}

interface AsaasSplitEntry {
  walletId: string
  percentualValue?: number
  fixedValue?: number
}

/**
 * Monta split: lojista (líquido) + vendai.club (take rate % + taxa fixa).
 * Usa percentual efetivo que incorpora a taxa fixa no valor cobrado.
 */
export function buildCheckoutSplit(
  merchantWalletId: string,
  quote: InstallmentQuote,
): AsaasSplitEntry[] {
  const platformWalletId = getVendaiAsaasWalletId()
  if (!platformWalletId) {
    throw new Error('VENDAI_ASAAS_WALLET_ID não configurado — split impossível')
  }
  if (!merchantWalletId) {
    throw new Error('Loja sem walletId Asaas — split impossível')
  }

  const totalCharged = quote.totalComJuros
  const platformTotal = round2(quote.platformFeeAmount + quote.platformFeeFixed)

  if (totalCharged <= 0) {
    throw new Error('Valor cobrado inválido para split')
  }

  const platformPct = round2((platformTotal / totalCharged) * 100)
  const merchantPct = round2(100 - platformPct)

  if (merchantPct <= 0 || platformPct <= 0) {
    throw new Error(
      `Split inválido: merchant ${merchantPct}% + platform ${platformPct}% (fee total R$${platformTotal})`,
    )
  }

  if (Math.abs(merchantPct + platformPct - 100) > 0.02) {
    throw new Error(
      `Split inválido: merchant ${merchantPct}% + platform ${platformPct}% ≠ 100%`,
    )
  }

  return [
    { walletId: merchantWalletId, percentualValue: merchantPct },
    { walletId: platformWalletId, percentualValue: platformPct },
  ]
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
