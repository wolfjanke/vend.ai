import { describe, it, expect } from 'vitest'
import { deriveThemeColors, isLight, expandHex, contrastRatio } from '@/lib/theme-derive'

describe('theme-derive', () => {
  it('expandHex normalizes 3-digit hex', () => {
    expect(expandHex('#abc')).toBe('#AABBCC')
  })

  it('derives dark palette with readable button text on dark primary', () => {
    const c = deriveThemeColors('#7B6EFF', '#00E5A0', 'dark')
    expect(c.primary).toBe('#7B6EFF')
    expect(c.cardBg).toBeTruthy()
    expect(c.textPrimary).toBe('#F0F0FF')
    expect(isLight(c.primary)).toBe(false)
    expect(c.buttonText).toBe('#FFFFFF')
  })

  it('derives light palette with dark button text on light primary', () => {
    const c = deriveThemeColors('#F5E6D3', '#C9A96E', 'light')
    expect(isLight(c.primary)).toBe(true)
    expect(c.buttonText).toBe('#1A1A2E')
  })

  it('secondary is derived from primary', () => {
    const c = deriveThemeColors('#7B6EFF', '#00E5A0', 'dark')
    expect(c.secondary).toBe(c.primaryDark)
  })

  it('uses readable price on light background when accent is yellow', () => {
    const c = deriveThemeColors('#E94B88', '#FFB703', 'light', '#FAF8FC')
    expect(contrastRatio(c.pricePrimary, c.cardBg)).toBeGreaterThanOrEqual(3)
    expect(c.pricePrimary).not.toBe('#FFB703')
  })

  it('uses theme text colors on light background', () => {
    const c = deriveThemeColors('#E94B88', '#FFB703', 'light', '#FAF8FC', {
      text:      '#2D1B69',
      textMuted: '#6B5589',
    })
    expect(c.textPrimary).toBe('#2D1B69')
    expect(contrastRatio(c.textMuted, c.pageBg)).toBeGreaterThanOrEqual(4.5)
  })
})
