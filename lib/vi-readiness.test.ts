import { describe, it, expect } from 'vitest'
import {
  assessProductReadiness,
  assessStoreViReadiness,
  VI_READINESS_MIN_PRODUCTS,
} from './vi-readiness'
import type { Product } from '@/types'

function product(patch: Partial<Product> = {}): Product {
  return {
    id:            'p1',
    store_id:      's1',
    name:          'Vestido floral',
    slug:          'vestido-floral',
    description:   'Lindo vestido',
    category:      'vestido',
    price:         129,
    promo_price:   null,
    active:        true,
    variants_json: [{
      id:       'v1',
      color:    'Rosa',
      colorHex: '#f0f',
      photos:   ['https://cdn.example/1.jpg'],
      stock:    { P: 2, M: 3, G: 1 },
    }],
    created_at: new Date().toISOString(),
    ...patch,
  }
}

describe('assessProductReadiness', () => {
  it('marca produto completo', () => {
    const r = assessProductReadiness(product())
    expect(r.complete).toBe(true)
    expect(r.score).toBe(100)
    expect(r.issues).toEqual([])
  })

  it('detecta falta de foto, preço e estoque', () => {
    const r = assessProductReadiness(product({
      price: 0,
      variants_json: [{
        id: 'v1', color: 'Azul', colorHex: '#00f', photos: [], stock: { M: 0 },
      }],
    }))
    expect(r.complete).toBe(false)
    expect(r.issues).toEqual(['no_photo', 'no_price', 'no_stock'])
    expect(r.score).toBe(0)
  })
})

describe('assessStoreViReadiness', () => {
  it('fica incomplete sem produtos', () => {
    const r = assessStoreViReadiness([])
    expect(r.level).toBe('incomplete')
    expect(r.percent).toBe(0)
  })

  it('fica almost com 1 produto completo', () => {
    const r = assessStoreViReadiness([product()])
    expect(r.level).toBe('almost')
    expect(r.completeProductCount).toBe(1)
  })

  it('fica ready com 3 produtos completos', () => {
    const items = Array.from({ length: VI_READINESS_MIN_PRODUCTS }, (_, i) =>
      product({ id: `p${i}`, name: `Peça ${i}`, slug: `peca-${i}` }),
    )
    const r = assessStoreViReadiness(items)
    expect(r.level).toBe('ready')
    expect(r.completeProductCount).toBe(VI_READINESS_MIN_PRODUCTS)
  })

  it('ignora produtos inativos na contagem', () => {
    const inactive = product({ id: 'p2', active: false })
    const r = assessStoreViReadiness([product(), inactive, inactive])
    expect(r.activeProductCount).toBe(1)
    expect(r.level).toBe('almost')
  })

  it('lista produtos incompletos', () => {
    const r = assessStoreViReadiness([
      product(),
      product({ id: 'p2', name: 'Sem foto', variants_json: [{
        id: 'v2', color: 'Preto', colorHex: '#000', photos: [], stock: { M: 1 },
      }] }),
    ])
    expect(r.incompleteProducts).toHaveLength(1)
    expect(r.incompleteProducts[0].name).toBe('Sem foto')
    expect(r.incompleteProducts[0].issues).toContain('no_photo')
  })
})
