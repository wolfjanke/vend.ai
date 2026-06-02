import { beforeAll, afterAll, describe, it, expect } from 'vitest'
import { buildCheckoutSplit, CHECKOUT_TAKE_RATE } from '../split'

describe('CHECKOUT_TAKE_RATE', () => {
  it('pro take rate is 2.75%', () => {
    expect(CHECKOUT_TAKE_RATE.pro).toBe(0.0275)
  })
})

describe('buildCheckoutSplit', () => {
  const orig = process.env.WOLF_HUB_WALLET_ID
  beforeAll(() => {
    process.env.WOLF_HUB_WALLET_ID = 'wallet_hub_test'
  })
  afterAll(() => {
    process.env.WOLF_HUB_WALLET_ID = orig
  })

  it('returns two split entries summing to 100%', () => {
    const split = buildCheckoutSplit('wallet_merchant', {
      faixaTaxa: 0.0275,
      totalComJuros: 100,
      installmentValue: 100,
      platformTakePct: 2.75,
      merchantSharePct: 97.25,
    })
    expect(split).toHaveLength(2)
    expect(split[0].walletId).toBe('wallet_merchant')
    expect(split[1].walletId).toBe('wallet_hub_test')
    expect(split[0].percentualValue + split[1].percentualValue).toBe(100)
  })
})
