import { describe, expect, it } from 'vitest'
import { mapAnalysisToVariantDraft, normalizeVolumeLabel, sanitizeBrandFromAnalysis } from '@/lib/product-analysis-map'
import type { ProductAnalysisItem } from '@/lib/product-analysis'

describe('normalizeVolumeLabel', () => {
  it('normaliza 50 ml', () => {
    expect(normalizeVolumeLabel('50 ml')).toBe('50ml')
  })
})

describe('mapAnalysisToVariantDraft', () => {
  it('volume: uma variante com chaves 50ml e 100ml', () => {
    const item: ProductAnalysisItem = {
      nome: 'Dior Sauvage EDT',
      descricao: 'Fragrância masculina.',
      categoria: 'perfumes',
      audience: 'masculine',
      audienceConfidence: 'alta',
      variationKind: 'volume',
      variantes: [
        { label: '50ml', cor: '50ml', corHex: '#1a2744' },
        { label: '100ml', cor: '100ml', corHex: '#1a2744' },
      ],
    }
    const mapped = mapAnalysisToVariantDraft(item, 'beauty', null, 2)
    expect(mapped.catalogAxes.stockAxis).toBe('volume')
    expect(mapped.variants.length).toBe(1)
    expect(mapped.variants[0].stock).toHaveProperty('50ml')
    expect(mapped.variants[0].stock).toHaveProperty('100ml')
    expect(mapped.variants[0].variantType).toBe('modelo')
  })

  it('frasco único', () => {
    const item: ProductAnalysisItem = {
      nome: 'Perfume Floral',
      descricao: 'Colônia feminina.',
      categoria: 'perfumes',
      audience: 'feminine',
      audienceConfidence: 'media',
      variationKind: 'bottle',
      variantes: [{ label: 'Frasco rosa', cor: 'Frasco rosa', corHex: '#ff69b4' }],
    }
    const mapped = mapAnalysisToVariantDraft(item, 'beauty', null, 1)
    expect(mapped.catalogAxes.stockAxis).toBe('unique')
    expect(mapped.variants[0].stock).toEqual({ 'Único': 0 })
  })

  it('moda: duas cores com preset clothing', () => {
    const item: ProductAnalysisItem = {
      nome: 'Camiseta Básica',
      descricao: 'Algodão.',
      categoria: 'camiseta',
      audience: 'unisex',
      audienceConfidence: 'alta',
      variationKind: 'color',
      variantes: [
        { label: 'Preta', cor: 'Preta', corHex: '#000000' },
        { label: 'Branca', cor: 'Branca', corHex: '#ffffff' },
      ],
    }
    const mapped = mapAnalysisToVariantDraft(item, 'fashion', null, 2)
    expect(mapped.variants.length).toBe(2)
    expect(mapped.variants[0].stock).toHaveProperty('P')
    expect(mapped.variants[0].variantType).toBe('cor')
  })

  it('retrocompat: só cor sem variationKind', () => {
    const item: ProductAnalysisItem = {
      nome: 'Vestido',
      descricao: 'Festivo.',
      categoria: 'vestido',
      audience: 'feminine',
      audienceConfidence: 'alta',
      variantes: [
        { cor: 'Azul', corHex: '#0000ff' },
        { cor: 'Vermelho', corHex: '#ff0000' },
      ],
    }
    const mapped = mapAnalysisToVariantDraft(item, 'fashion', null, 2)
    expect(mapped.variants.length).toBe(2)
    expect(mapped.aiMeta.variationKind).toBe('color')
  })
})

describe('sanitizeBrandFromAnalysis', () => {
  it('remove marca do nome quando includeBrand é false', () => {
    const item: ProductAnalysisItem = {
      nome: 'Nike Bermuda Azul',
      descricao: 'Jeans.',
      categoria: 'bermuda',
      audience: 'masculine',
      audienceConfidence: 'alta',
      attributes: { brand: 'Nike' },
      variantes: [{ cor: 'Azul', corHex: '#0000ff' }],
    }
    const { item: cleaned, brand } = sanitizeBrandFromAnalysis(item, false)
    expect(brand).toBeNull()
    expect(cleaned.nome).toBe('Bermuda Azul')
    expect(cleaned.attributes?.brand).toBeUndefined()
  })

  it('preserva marca quando includeBrand é true', () => {
    const item: ProductAnalysisItem = {
      nome: 'Nike Bermuda Azul',
      descricao: 'Jeans.',
      categoria: 'bermuda',
      audience: 'masculine',
      audienceConfidence: 'alta',
      attributes: { brand: 'Nike' },
      variantes: [{ cor: 'Azul', corHex: '#0000ff' }],
    }
    const { item: kept, brand } = sanitizeBrandFromAnalysis(item, true)
    expect(brand).toBe('Nike')
    expect(kept.nome).toBe('Nike Bermuda Azul')
  })
})
