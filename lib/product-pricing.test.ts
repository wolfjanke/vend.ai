import { describe, expect, it } from 'vitest'
import { resolveSkuUnitPrice, resolveProductDisplayPriceRange } from '@/lib/product-pricing'
import type { Product } from '@/types'

const baseProduct: Product = {
  id:            'p1',
  store_id:      's1',
  name:          'Perfume',
  description:   '',
  category:      'perfumes',
  price:         100,
  promo_price:   null,
  variants_json: [{
    id:       'v1',
    color:    'Linha',
    colorHex: '#888',
    photos:   [],
    stock:    { '50ml': 5, '100ml': 3 },
    stockPrices: { '50ml': 80, '100ml': 120 },
  }],
  active:     true,
  created_at: '',
}

describe('resolveSkuUnitPrice', () => {
  it('usa stockPromoPrices quando definido', () => {
    const v = {
      ...baseProduct.variants_json[0],
      stockPromoPrices: { '50ml': 70 },
    }
    expect(resolveSkuUnitPrice(baseProduct, v, '50ml')).toBe(70)
  })

  it('usa stockPrices quando sem promo SKU', () => {
    expect(resolveSkuUnitPrice(baseProduct, baseProduct.variants_json[0], '100ml')).toBe(120)
  })

  it('fallback product.price sem stockPrices', () => {
    const v = { ...baseProduct.variants_json[0], stockPrices: undefined }
    expect(resolveSkuUnitPrice(baseProduct, v, '50ml')).toBe(100)
  })
})

describe('resolveProductDisplayPriceRange', () => {
  it('retorna min/max de SKUs com estoque', () => {
    const range = resolveProductDisplayPriceRange(baseProduct)
    expect(range.min).toBe(80)
    expect(range.max).toBe(120)
    expect(range.hasSkuPrices).toBe(true)
  })
})
