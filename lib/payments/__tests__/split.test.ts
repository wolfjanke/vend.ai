import { beforeAll, afterAll, describe, it, expect } from 'vitest'
import { buildCheckoutSplit, CHECKOUT_TAKE_RATE } from '../split'

describe('CHECKOUT_TAKE_RATE', () => {
  it('free take rate is 3.9%', () => {
    expect(CHECKOUT_TAKE_RATE.free).toBe(0.039)
  })

  it('pro take rate is 2.75%', () => {
    expect(CHECKOUT_TAKE_RATE.pro).toBe(0.0275)
  })
})

describe('buildCheckoutSplit', () => {
  const orig = process.env.VENDAI_ASAAS_WALLET_ID
  beforeAll(() => {
    process.env.VENDAI_ASAAS_WALLET_ID = 'wallet_vendai_test'
  })
  afterAll(() => {
    process.env.VENDAI_ASAAS_WALLET_ID = orig
  })

  it('returns two split entries summing to 100% (inclui taxa fixa)', () => {
    const split = buildCheckoutSplit('wallet_merchant', {
      faixaTaxa:          0.0275,
      totalComJuros:      102.75,
      installmentValue:   102.75,
      platformTakePct:    2.68,
      merchantSharePct:   97.32,
      platformFeeAmount:  2.75,
      platformFeeFixed:   0.99,
      netValue:           99.01,
    })
    expect(split).toHaveLength(2)
    expect(split[0].walletId).toBe('wallet_merchant')
    expect(split[1].walletId).toBe('wallet_vendai_test')
    const sum = (split[0].percentualValue ?? 0) + (split[1].percentualValue ?? 0)
    expect(sum).toBe(100)
  })
})
