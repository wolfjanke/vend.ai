import { calculateCheckoutPricing, type PricingResult } from '@/lib/pricing'
import type { CartItem, StoreSettings } from '@/types'

export type CheckoutBillingType = 'PIX' | 'CREDIT_CARD'

export function checkoutPricingPaymentMethod(billingType: CheckoutBillingType): 'PIX' | 'OUTRO' {
  return billingType === 'PIX' ? 'PIX' : 'OUTRO'
}

export function calculateCheckoutMarketingPricing(params: {
  items:        CartItem[]
  billingType:  CheckoutBillingType
  couponCode?:  string
  settings?:    StoreSettings
}): PricingResult {
  return calculateCheckoutPricing({
    items:         params.items,
    paymentMethod: checkoutPricingPaymentMethod(params.billingType),
    couponCode:    params.couponCode,
    settings:      params.settings,
  })
}
