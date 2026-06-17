import { describe, expect, it } from 'vitest'
import {
  calculateCheckoutMarketingPricing,
  checkoutPricingPaymentMethod,
} from './marketing-pricing'

describe('checkoutPricingPaymentMethod', () => {
  it('maps PIX and card', () => {
    expect(checkoutPricingPaymentMethod('PIX')).toBe('PIX')
    expect(checkoutPricingPaymentMethod('CREDIT_CARD')).toBe('OUTRO')
  })
})

describe('calculateCheckoutMarketingPricing', () => {
  const items = [{ product_id: 'p1', variant_id: 'v1', name: 'Item', size: 'M', color: 'Azul', qty: 2, price: 50 }]

  it('applies PIX discount when billing is PIX', () => {
    const result = calculateCheckoutMarketingPricing({
      items,
      billingType: 'PIX',
      settings: { pixDiscountPercent: 10 },
    })
    expect(result.subtotal).toBe(100)
    expect(result.discountPix).toBe(10)
    expect(result.totalFinal).toBe(90)
  })

  it('does not apply PIX discount on card', () => {
    const result = calculateCheckoutMarketingPricing({
      items,
      billingType: 'CREDIT_CARD',
      settings: { pixDiscountPercent: 10 },
    })
    expect(result.discountPix).toBe(0)
    expect(result.totalFinal).toBe(100)
  })

  it('applies coupon before PIX discount', () => {
    const result = calculateCheckoutMarketingPricing({
      items,
      billingType: 'PIX',
      couponCode: 'OFF10',
      settings: {
        pixDiscountPercent: 10,
        couponRules: [{
          id: 'c1',
          code: 'OFF10',
          type: 'percent',
          value: 10,
          active: true,
        }],
      },
    })
    expect(result.discountCoupon).toBe(10)
    expect(result.discountPix).toBe(9)
    expect(result.totalFinal).toBe(81)
  })
})
