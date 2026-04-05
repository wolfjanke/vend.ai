import { describe, it, expect } from 'vitest'
import { calculateInstallmentQuote, getFaixa } from '../installment-fees'
import type { PlanSlug } from '@/types'

describe('getFaixa', () => {
  it('1x → 1-3', () => expect(getFaixa(1)).toBe('1-3'))
  it('3x → 1-3', () => expect(getFaixa(3)).toBe('1-3'))
  it('4x → 4-6', () => expect(getFaixa(4)).toBe('4-6'))
  it('6x → 4-6', () => expect(getFaixa(6)).toBe('4-6'))
  it('7x → 7-9', () => expect(getFaixa(7)).toBe('7-9'))
  it('9x → 7-9', () => expect(getFaixa(9)).toBe('7-9'))
  it('10x → 10-12', () => expect(getFaixa(10)).toBe('10-12'))
  it('12x → 10-12', () => expect(getFaixa(12)).toBe('10-12'))
})

describe('Casos obrigatórios do plano', () => {
  it('Pro, 6x, R$600 → installmentValue = 106.50, merchantSharePct = 93.5', () => {
    const q = calculateInstallmentQuote(600, 6, 'pro')
    expect(q.installmentValue).toBe(106.50)
    expect(q.merchantSharePct).toBe(93.5)
    expect(q.platformTakePct).toBe(6.5)
  })

  it('Loja, 12x, R$800 → installmentValue = 73.67, merchantSharePct = 89.5', () => {
    // 800 * 1.105 (faixa 10-12) = 884.00 / 12 = 73.6666... → round2 = 73.67
    const q = calculateInstallmentQuote(800, 12, 'loja')
    expect(q.installmentValue).toBe(73.67)
    expect(q.merchantSharePct).toBe(89.5)
    expect(q.platformTakePct).toBe(10.5)
  })

  it('Grátis, 1x, R$100 → platformTakePct = 4.5, merchantSharePct = 95.5', () => {
    const q = calculateInstallmentQuote(100, 1, 'free')
    expect(q.platformTakePct).toBe(4.5)
    expect(q.merchantSharePct).toBe(95.5)
    expect(q.totalComJuros).toBe(104.50)
    expect(q.installmentValue).toBe(104.50)
  })
})

describe('merchantSharePct + platformTakePct === 100 para todas as combinações', () => {
  const plans: PlanSlug[]     = ['free', 'starter', 'pro', 'loja']
  const installmentSets       = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

  for (const plan of plans) {
    for (const n of installmentSets) {
      it(`${plan} ${n}x → soma = 100`, () => {
        const q = calculateInstallmentQuote(1000, n, plan)
        const soma = Math.round((q.merchantSharePct + q.platformTakePct) * 10000) / 10000
        expect(soma).toBe(100)
      })
    }
  }
})

describe('Validações de range', () => {
  it('installments = 0 lança RangeError', () => {
    expect(() => calculateInstallmentQuote(100, 0, 'pro')).toThrow(RangeError)
  })
  it('installments = 13 lança RangeError', () => {
    expect(() => calculateInstallmentQuote(100, 13, 'pro')).toThrow(RangeError)
  })
})

describe('Todas as 16 combinações plano × faixa (sem falhas de arredondamento)', () => {
  const plans: PlanSlug[] = ['free', 'starter', 'pro', 'loja']
  const faixaRepresentatives = [1, 4, 7, 10] // um por faixa

  for (const plan of plans) {
    for (const n of faixaRepresentatives) {
      it(`${plan} ${n}x → valores válidos`, () => {
        const q = calculateInstallmentQuote(500, n, plan)
        expect(q.installmentValue).toBeGreaterThan(0)
        expect(q.totalComJuros).toBeGreaterThanOrEqual(500)
        expect(q.faixaTaxa).toBeGreaterThan(0)
        expect(q.platformTakePct).toBeGreaterThan(0)
        expect(q.merchantSharePct).toBeGreaterThan(0)
        expect(q.merchantSharePct).toBeLessThan(100)
      })
    }
  }
})
