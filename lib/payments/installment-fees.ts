import type { InstallmentQuote } from '@/types'
import type { PlanSlug } from '@/lib/plans'
import {
  DEFAULT_CHECKOUT_RATES,
  takeRateFraction,
  type CheckoutRates,
  type FaixaKey,
} from '@/lib/checkout-rates'

export type InterestBearer = 'customer' | 'merchant'

export function getFaixa(installments: number): FaixaKey {
  if (installments <= 3)  return '1-3'
  if (installments <= 6)  return '4-6'
  if (installments <= 9)  return '7-9'
  return '10-12'
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000
}

export interface QuoteOptions {
  /** customer = repassa juros ao cliente (padrão); merchant = lojista absorve */
  interestBearer?: InterestBearer
}

/**
 * Calcula cotação de parcelamento com take rate + taxa fixa R$0,99.
 * rates pode ser injetado pelo server (global_config); client usa DEFAULT_CHECKOUT_RATES.
 */
export function calculateInstallmentQuote(
  grossValue:   number,
  installments: number,
  plan:         PlanSlug,
  rates:        CheckoutRates = DEFAULT_CHECKOUT_RATES,
  options:      QuoteOptions = {},
): InstallmentQuote {
  if (installments < 1 || installments > 12) {
    throw new RangeError(`installments deve estar entre 1 e 12, recebido: ${installments}`)
  }

  const interestBearer = options.interestBearer ?? 'customer'
  const isAVista       = installments === 1
  const fixedFee       = rates.fixedFee

  let faixaTaxa: number

  if (isAVista) {
    faixaTaxa = takeRateFraction(plan, rates)
  } else {
    const faixa = getFaixa(installments)
    faixaTaxa = rates.installmentFaixas[plan][faixa]
  }

  const totalComJuros =
    interestBearer === 'customer'
      ? round2(grossValue * (1 + faixaTaxa))
      : round2(grossValue)

  const installmentValue = round2(totalComJuros / installments)

  const platformFeeAmount = round2(grossValue * faixaTaxa)
  const platformFeeFixed  = fixedFee
  const netValue          = round2(totalComJuros - platformFeeAmount - platformFeeFixed)

  const platformTakePct  = round4((platformFeeAmount / totalComJuros) * 100)
  const merchantSharePct = round4(100 - platformTakePct)

  return {
    faixaTaxa,
    totalComJuros,
    installmentValue,
    platformTakePct,
    merchantSharePct,
    platformFeeAmount,
    platformFeeFixed,
    netValue,
  }
}
