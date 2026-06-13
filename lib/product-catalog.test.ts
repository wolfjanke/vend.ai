import { describe, expect, it } from 'vitest'
import { inferCatalogMode, isBeautyCategory } from '@/lib/product-catalog'

describe('isBeautyCategory', () => {
  it('detecta slug de perfumes', () => {
    expect(isBeautyCategory('perfumes')).toBe(true)
    expect(isBeautyCategory('camiseta')).toBe(false)
  })

  it('detecta pelo label customizado', () => {
    expect(
      isBeautyCategory('cat1', [{ value: 'cat1', label: 'Body Splash' }]),
    ).toBe(true)
  })
})

describe('inferCatalogMode', () => {
  it('prioriza hint de perfume', () => {
    expect(
      inferCatalogMode({ pieceType: 'perfumes' }, []),
    ).toBe('beauty')
  })

  it('prioriza hint de moda', () => {
    expect(
      inferCatalogMode({ pieceType: 'vestido' }, []),
    ).toBe('fashion')
  })

  it('loja só com categorias de beleza → beauty', () => {
    expect(
      inferCatalogMode(null, [
        { value: 'perfumes', label: 'Perfumes' },
        { value: 'cosmeticos', label: 'Cosméticos' },
      ]),
    ).toBe('beauty')
  })

  it('loja com perfumes e relógios → mixed', () => {
    expect(
      inferCatalogMode(null, [
        { value: 'perfumes', label: 'Perfumes' },
        { value: 'relogios', label: 'Relógios' },
      ]),
    ).toBe('mixed')
  })

  it('sem custom categories → fashion', () => {
    expect(inferCatalogMode(null, [])).toBe('fashion')
  })
})
