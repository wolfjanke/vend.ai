import { describe, expect, it } from 'vitest'
import { normalizeThemeSuggestion, parseThemeAnalysis } from '@/lib/theme-ai'

describe('normalizeThemeSuggestion', () => {
  it('usa pageBg quando hex válido', () => {
    const s = normalizeThemeSuggestion({
      themeName: 'lumiere',
      label: 'Luxo dourado',
      reason: 'Combina com a logo',
      primary: '#C9A96E',
      secondary: '#2C2C2C',
      accent: '#C9A96E',
      pageBg: '#0C0A08',
    })
    expect(s?.pageBg).toBe('#0C0A08')
    expect(s?.background).toBe('dark')
  })

  it('faz fallback de pageBg a partir de background legado', () => {
    const s = normalizeThemeSuggestion({
      themeName: 'editorial',
      label: 'Editorial',
      reason: 'Minimalista',
      primary: '#000000',
      secondary: '#333333',
      accent: '#000000',
      background: 'light',
    })
    expect(s?.pageBg).toBe('#FFFFFF')
    expect(s?.background).toBe('light')
  })

  it('rejeita themeName inválido', () => {
    expect(
      normalizeThemeSuggestion({
        themeName: 'inexistente',
        primary: '#000000',
        accent: '#000000',
      }),
    ).toBeNull()
  })
})

describe('parseThemeAnalysis', () => {
  it('normaliza todas as sugestões do JSON', () => {
    const result = parseThemeAnalysis(JSON.stringify({
      summary: 'Identidade premium',
      suggestions: [
        {
          themeName: 'lumiere',
          label: 'Boutique',
          reason: 'Dourado na logo',
          primary: '#C9A96E',
          secondary: '#2C2C2C',
          accent: '#C9A96E',
          pageBg: '#FAF9F7',
        },
        {
          themeName: 'street',
          label: 'Street',
          reason: 'Vibrante',
          primary: '#FE2C55',
          secondary: '#25F4EE',
          accent: '#FE2C55',
          background: 'dark',
        },
      ],
    }))

    expect(result.summary).toBe('Identidade premium')
    expect(result.suggestions).toHaveLength(2)
    expect(result.suggestions[0]?.pageBg).toBe('#FAF9F7')
    expect(result.suggestions[1]?.pageBg).toBe('#0A0A0A')
  })

  it('extrai JSON embutido em texto', () => {
    const result = parseThemeAnalysis(`
      Análise:
      {"summary":"Ok","suggestions":[{"themeName":"default","label":"Padrão","reason":"Neutro","primary":"#7B6EFF","secondary":"#5A4FCC","accent":"#00E5A0","pageBg":"#08080F"}]}
    `)
    expect(result.suggestions[0]?.pageBg).toBe('#08080F')
  })
})
