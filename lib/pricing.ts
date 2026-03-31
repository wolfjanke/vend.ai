import type { CartItem, CouponRule, StoreSettings } from '@/types'

export interface PricingInput {
  items: CartItem[]
  paymentMethod: 'PIX' | 'OUTRO'
  couponCode?: string
  settings?: StoreSettings
  nowDate?: string
}

export interface PricingResult {
  subtotal: number
  discountCoupon: number
  discountPix: number
  discountTotal: number
  totalFinal: number
  paymentMethod: 'PIX' | 'OUTRO'
  couponCodeApplied: string | null
}

function asMoney(n: number): number {
  return Math.max(0, Number(n.toFixed(2)))
}

function isCouponActive(rule: CouponRule, today: string): boolean {
  if (!rule.active) return false
  if (rule.startDate && rule.startDate > today) return false
  if (rule.endDate && rule.endDate < today) return false
  return true
}

export function calculateCheckoutPricing(input: PricingInput): PricingResult {
  const subtotal = asMoney(input.items.reduce((s, c) => s + Number(c.price) * Number(c.qty), 0))
  const today = input.nowDate ?? new Date().toISOString().slice(0, 10)
  const code = (input.couponCode ?? '').trim().toUpperCase()
  const rules = input.settings?.couponRules ?? []
  const pixDiscountPercent = Number(input.settings?.pixDiscountPercent ?? 0)

  let discountCoupon = 0
  let couponCodeApplied: string | null = null
  const coupon = code ? rules.find(r => r.code.trim().toUpperCase() === code) : undefined
  if (coupon && isCouponActive(coupon, today)) {
    const minOrder = Number(coupon.minOrderValue ?? 0)
    if (subtotal >= minOrder) {
      discountCoupon = coupon.type === 'percent'
        ? subtotal * (Number(coupon.value) / 100)
        : Number(coupon.value)
      if (coupon.maxDiscountValue != null) {
        discountCoupon = Math.min(discountCoupon, Number(coupon.maxDiscountValue))
      }
      discountCoupon = asMoney(Math.min(discountCoupon, subtotal))
      if (discountCoupon > 0) couponCodeApplied = coupon.code.trim().toUpperCase()
    }
  }

  const afterCoupon = asMoney(subtotal - discountCoupon)
  const discountPix = input.paymentMethod === 'PIX' && pixDiscountPercent > 0
    ? asMoney(afterCoupon * (pixDiscountPercent / 100))
    : 0

  const discountTotal = asMoney(discountCoupon + discountPix)
  const totalFinal = asMoney(Math.max(0, subtotal - discountTotal))

  return {
    subtotal,
    discountCoupon,
    discountPix,
    discountTotal,
    totalFinal,
    paymentMethod: input.paymentMethod,
    couponCodeApplied,
  }
}
