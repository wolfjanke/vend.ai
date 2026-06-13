import { describe, expect, it } from 'vitest'
import { normalizeProductAudience, parseProductAudience } from '@/lib/product-audience'

describe('parseProductAudience', () => {
  it('aceita aliases em português', () => {
    expect(parseProductAudience('fem')).toBe('feminine')
    expect(parseProductAudience('masculino')).toBe('masculine')
    expect(parseProductAudience('unissex')).toBe('unisex')
  })
})

describe('normalizeProductAudience', () => {
  it('prioriza hint do lojista', () => {
    expect(
      normalizeProductAudience({
        audience: 'feminine',
        audienceConfidence: 'alta',
        category: 'camiseta',
        hintAudience: 'masculine',
      }),
    ).toBe('masculine')
  })

  it('força unissex quando confiança é baixa', () => {
    expect(
      normalizeProductAudience({
        audience: 'feminine',
        audienceConfidence: 'baixa',
        category: 'camiseta',
      }),
    ).toBe('unisex')
  })

  it('mantém feminine para vestido mesmo com confiança baixa', () => {
    expect(
      normalizeProductAudience({
        audience: 'unisex',
        audienceConfidence: 'baixa',
        category: 'vestido',
      }),
    ).toBe('feminine')
  })

  it('infere kids pela categoria infantil', () => {
    expect(
      normalizeProductAudience({
        category: 'infantil',
      }),
    ).toBe('kids')
  })
})
