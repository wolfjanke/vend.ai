import type { PlanSlug, InstallmentQuote } from '@/types'

type FaixaKey = '1-3' | '4-6' | '7-9' | '10-12'

// Taxa aplicada ao cliente (juros embutidos no installmentValue)
// O merchant recebe o valor cheio; a plataforma retém o percentual
const FAIXAS: Record<PlanSlug, Record<FaixaKey, number>> = {
  free:    { '1-3': 0.045, '4-6': 0.085, '7-9': 0.125, '10-12': 0.165 },
  starter: { '1-3': 0.040, '4-6': 0.075, '7-9': 0.110, '10-12': 0.145 },
  pro:     { '1-3': 0.036, '4-6': 0.065, '7-9': 0.095, '10-12': 0.125 },
  loja:    { '1-3': 0.035, '4-6': 0.055, '7-9': 0.080, '10-12': 0.105 },
}

// Taxa à vista (1x): platform take rate
const SPLIT_A_VISTA: Record<PlanSlug, number> = {
  free:    0.045,
  starter: 0.040,
  pro:     0.025,
  loja:    0.017,
}

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

/**
 * Calcula a cotação de parcelamento.
 * - grossValue: valor bruto do pedido (sem juros)
 * - installments: 1–12
 * - plan: plano do lojista
 *
 * O cliente paga os juros (faixaTaxa).
 * A plataforma retém platformTakePct sobre o valor com juros.
 * O merchant recebe merchantSharePct do valor com juros = valor bruto original.
 */
export function calculateInstallmentQuote(
  grossValue:   number,
  installments: number,
  plan:         PlanSlug,
): InstallmentQuote {
  if (installments < 1 || installments > 12) {
    throw new RangeError(`installments deve estar entre 1 e 12, recebido: ${installments}`)
  }

  const isAVista = installments === 1

  let faixaTaxa: number
  let platformTakePct: number

  if (isAVista) {
    faixaTaxa      = SPLIT_A_VISTA[plan]
    platformTakePct = round4(SPLIT_A_VISTA[plan] * 100)
  } else {
    const faixa    = getFaixa(installments)
    faixaTaxa      = FAIXAS[plan][faixa]
    platformTakePct = round4(faixaTaxa * 100)
  }

  const totalComJuros    = round2(grossValue * (1 + faixaTaxa))
  const installmentValue = round2(totalComJuros / installments)
  const merchantSharePct = round4(100 - platformTakePct)

  return {
    faixaTaxa,
    totalComJuros,
    installmentValue,
    platformTakePct,
    merchantSharePct,
  }
}
