import { describe, it, expect } from 'vitest'
import { getLowStockSkus, normalizeStockAlerts, productLowStockMinQty } from './stock-alerts'
import type { Product } from '@/types'

const baseProduct = (patch: Partial<Product> = {}): Product => ({
  id:            'p1',
  store_id:      's1',
  name:          'Vestido',
  slug:          'vestido',
  category:      'vestidos',
  price:         100,
  promo_price:   null,
  active:        true,
  variants_json: [{
    id:       'v1',
    color:    'Rosa',
    colorHex: '#f00',
    photos:   [],
    stock:    { M: 2, G: 10 },
  }],
  created_at: new Date().toISOString(),
  ...patch,
})

describe('normalizeStockAlerts', () => {
  it('aplica defaults', () => {
    expect(normalizeStockAlerts(null)).toEqual({ enabled: false, threshold: 3 })
  })

  it('limita threshold entre 1 e 99', () => {
    expect(normalizeStockAlerts({ threshold: 0 }).threshold).toBe(1)
    expect(normalizeStockAlerts({ threshold: 200 }).threshold).toBe(99)
  })
})

describe('getLowStockSkus', () => {
  it('retorna vazio quando desligado', () => {
    expect(getLowStockSkus([baseProduct()], { enabled: false, threshold: 3 })).toEqual([])
  })

  it('detecta SKU abaixo do limite', () => {
    const skus = getLowStockSkus([baseProduct()], { enabled: true, threshold: 3 })
    expect(skus).toHaveLength(1)
    expect(skus[0].skuKey).toBe('M')
    expect(skus[0].qty).toBe(2)
  })

  it('ignora produto inativo', () => {
    const skus = getLowStockSkus(
      [baseProduct({ active: false })],
      { enabled: true, threshold: 3 },
    )
    expect(skus).toHaveLength(0)
  })
})

describe('productLowStockMinQty', () => {
  it('retorna menor qty em alerta', () => {
    expect(productLowStockMinQty(baseProduct(), 3)).toBe(2)
  })

  it('retorna null sem estoque baixo', () => {
    const p = baseProduct({
      variants_json: [{ id: 'v1', color: 'Azul', colorHex: '#00f', photos: [], stock: { M: 20 } }],
    })
    expect(productLowStockMinQty(p, 3)).toBeNull()
  })
})
