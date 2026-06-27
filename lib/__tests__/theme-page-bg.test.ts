import { describe, expect, it } from 'vitest'
import {
  colorsMatchThemeDefaults,
  getPageBgThemeHarmonyWarning,
  getThemeDefaultPalette,
  palettesMatch,
} from '@/lib/theme-page-bg'
import { getTheme } from '@/lib/themes'

describe('getThemeDefaultPalette', () => {
  it('retorna primária, destaque e fundo padrão do tema', () => {
    const palette = getThemeDefaultPalette(getTheme('default'))
    expect(palette.primary).toBe('#7B6EFF')
    expect(palette.accent).toBe('#00E5A0')
    expect(palette.pageBg).toBe('#08080F')
  })

  it('usa backgroundLight quando defaultBackground é light', () => {
    const palette = getThemeDefaultPalette(getTheme('editorial'))
    expect(palette.pageBg).toBe('#FFFFFF')
  })
})

describe('colorsMatchThemeDefaults', () => {
  it('aceita hex equivalente com casing diferente', () => {
    expect(
      colorsMatchThemeDefaults('default', '#7b6eff', '#00e5a0', '#08080f'),
    ).toBe(true)
  })

  it('detecta personalização', () => {
    expect(
      colorsMatchThemeDefaults('default', '#FF0000', '#00E5A0', '#08080F'),
    ).toBe(false)
  })
})

describe('getPageBgThemeHarmonyWarning', () => {
  it('avisa fundo claro em layout só escuro', () => {
    const msg = getPageBgThemeHarmonyWarning(getTheme('street'), '#FFFFFF')
    expect(msg).toContain('fundo escuro')
  })

  it('avisa fundo escuro em layout só claro', () => {
    const msg = getPageBgThemeHarmonyWarning(getTheme('pop'), '#111111')
    expect(msg).toContain('fundo claro')
  })

  it('retorna null quando combinação é permitida', () => {
    expect(getPageBgThemeHarmonyWarning(getTheme('editorial'), '#FFFFFF')).toBeNull()
  })
})

describe('palettesMatch', () => {
  it('compara três cores normalizadas', () => {
    expect(
      palettesMatch(
        { primary: '#ABC', accent: '#DEF', pageBg: '#111' },
        { primary: '#AABBCC', accent: '#DDEEFF', pageBg: '#111111' },
      ),
    ).toBe(true)
  })
})
