import { describe, expect, it } from 'vitest'
import { filterActiveBanners, isBannerImageRoadmapUnlocked, resolveBannerDisplayText } from './banners'

describe('filterActiveBanners', () => {
  const today = new Date().toISOString().slice(0, 10)

  it('keeps banner with text and no dates', () => {
    expect(filterActiveBanners([{ id: '1', text: 'Frete grátis' }])).toHaveLength(1)
  })

  it('drops empty text', () => {
    expect(filterActiveBanners([{ id: '1', text: '   ' }])).toHaveLength(0)
  })

  it('respects end date', () => {
    const past = '2000-01-01'
    expect(
      filterActiveBanners([{ id: '1', text: 'Promo', endDate: past }]),
    ).toHaveLength(0)
  })

  it('allows banner starting today', () => {
    const result = filterActiveBanners([
      { id: '1', text: 'Promo', startDate: today, endDate: today },
    ])
    expect(result).toHaveLength(1)
  })

  it('resolveBannerDisplayText prefers text over legacy title', () => {
    expect(resolveBannerDisplayText({ text: 'PIX 5%', title: 'Promo' })).toBe('PIX 5%')
    expect(resolveBannerDisplayText({ text: '', title: 'Só título' })).toBe('Só título')
  })
})

describe('isBannerImageRoadmapUnlocked', () => {
  it('unlocks at 10 active stores', () => {
    expect(isBannerImageRoadmapUnlocked(9)).toBe(false)
    expect(isBannerImageRoadmapUnlocked(10)).toBe(true)
  })
})
