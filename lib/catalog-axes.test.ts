import { describe, expect, it } from 'vitest'
import { inferCatalogAxes } from '@/lib/catalog-axes'
import { sortStockKeys, stockKeysForAxes } from '@/types'
import type { Product } from '@/types'

describe('stockKeysForAxes', () => {
  it('retorna grade numérica 36–48', () => {
    expect(stockKeysForAxes('numeric')).toEqual(['36', '38', '40', '42', '44', '46', '48'])
  })
})

describe('sortStockKeys', () => {
  it('ordena tamanhos de roupa do menor para o maior', () => {
    expect(sortStockKeys(['G', 'P', 'GG', 'M'], { stockAxis: 'clothing' })).toEqual(['P', 'M', 'G', 'GG'])
  })

  it('ordena volumes por ml', () => {
    expect(sortStockKeys(['100ml', '30ml', '50ml'], { stockAxis: 'volume' })).toEqual(['30ml', '50ml', '100ml'])
  })
})

describe('inferCatalogAxes', () => {
  it('infere numeric quando stock usa tamanhos numéricos', () => {
    const product: Product = {
      id:            '1',
      store_id:      's1',
      name:          'Bermuda',
      description:   '',
      category:      'bermuda',
      price:         99,
      promo_price:   null,
      variants_json: [{
        id:       'v1',
        color:    'Azul',
        colorHex: '#0000ff',
        photos:   [],
        stock:    { '40': 2, '42': 1 },
      }],
      active:     true,
      created_at: new Date().toISOString(),
    }
    expect(inferCatalogAxes(product).stockAxis).toBe('numeric')
  })
})
