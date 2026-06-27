import { describe, expect, it } from 'vitest'
import {
  adjustAccentForCardContrast,
  getAccentOnCardContrastIssue,
  getThemeContrastWarnings,
} from '@/lib/theme-contrast'

describe('getAccentOnCardContrastIssue', () => {
  it('retorna null quando destaque contrasta no card', () => {
    expect(
      getAccentOnCardContrastIssue('#E31837', '#3483FA', '#EEEEEE'),
    ).toBeNull()
  })

  it('detecta destaque fraco sobre o card derivado', () => {
    expect(
      getAccentOnCardContrastIssue('#FAFAFA', '#3483FA', '#EEEEEE'),
    ).toBe('Destaque pouco visível em badges e preços nos cards')
  })
})

describe('adjustAccentForCardContrast', () => {
  it('escurece destaque claro até contrastar no card', () => {
    const adjusted = adjustAccentForCardContrast('#FAFAFA', '#3483FA', '#EEEEEE', 3)
    expect(adjusted.toUpperCase()).not.toBe('#FAFAFA')
    expect(getAccentOnCardContrastIssue(adjusted, '#3483FA', '#EEEEEE')).toBeNull()
  })
})

describe('getThemeContrastWarnings', () => {
  it('inclui aviso de destaque nos cards quando ratio < 3', () => {
    const warnings = getThemeContrastWarnings(
      { primary: '#3483FA', accent: '#FAFAFA' },
      '#EEEEEE',
    )
    expect(warnings.some(w => w.includes('destaque nos cards'))).toBe(true)
  })
})
