import { deriveThemeColors } from '@/lib/theme-derive'

const HEX_RE = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/

export function isValidHex(color: string): boolean {
  return HEX_RE.test(color.trim())
}

function expandHex(hex: string): string {
  const h = hex.trim()
  if (h.length === 7) return h
  const r = h[1] + h[1]
  const g = h[2] + h[2]
  const b = h[3] + h[3]
  return `#${r}${g}${b}`
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const e = expandHex(hex).slice(1)
  return {
    r: parseInt(e.slice(0, 2), 16),
    g: parseInt(e.slice(2, 4), 16),
    b: parseInt(e.slice(4, 6), 16),
  }
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg)
  const l2 = relativeLuminance(bg)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

export function getHexContrastRatio(fg: string, bg: string): number {
  if (!isValidHex(fg) || !isValidHex(bg)) return 21
  return contrastRatio(expandHex(fg), expandHex(bg))
}

function mixHex(hex: string, target: string, t: number): string {
  const a = hexToRgb(hex)
  const b = hexToRgb(target)
  const ch = (x: number, y: number) =>
    Math.max(0, Math.min(255, Math.round(x + (y - x) * t)))
  const r = ch(a.r, b.r)
  const g = ch(a.g, b.g)
  const bl = ch(a.b, b.b)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`
}

/** Contraste mínimo para destaque em badges/preço sobre o card derivado. */
export const CARD_ACCENT_CONTRAST_MIN = 3

/** Escurece ou clareia a cor até atingir contraste mínimo vs fundo (WCAG AA 4.5:1). */
export function adjustHexForContrast(
  fg: string,
  bg: string,
  targetRatio = 4.5,
): string {
  if (!isValidHex(fg) || !isValidHex(bg)) return fg
  let color = expandHex(fg)
  const bgHex = expandHex(bg)
  if (contrastRatio(color, bgHex) >= targetRatio) return color

  const towardWhite = relativeLuminance(bgHex) < 0.5
  const target = towardWhite ? '#FFFFFF' : '#000000'

  for (let step = 0; step < 12; step++) {
    color = mixHex(color, target, 0.15)
    if (contrastRatio(color, bgHex) >= targetRatio) return color
  }
  return color
}

function meetsWcagAA(fg: string, bg: string): boolean {
  return contrastRatio(fg, bg) >= 4.5
}

function meetsMinContrast(fg: string, bg: string, minRatio: number): boolean {
  return contrastRatio(expandHex(fg), expandHex(bg)) >= minRatio
}

export function getAccentOnCardContrastIssue(
  accent: string,
  primary: string,
  pageBg: string,
  minRatio = CARD_ACCENT_CONTRAST_MIN,
): string | null {
  if (!isValidHex(accent) || !isValidHex(primary) || !isValidHex(pageBg)) return null
  const { cardBg } = deriveThemeColors(primary.trim(), accent.trim(), pageBg.trim())
  if (getHexContrastRatio(accent, cardBg) >= minRatio) return null
  return 'Destaque pouco visível em badges e preços nos cards'
}

export function adjustAccentForCardContrast(
  accent: string,
  primary: string,
  pageBg: string,
  minRatio = CARD_ACCENT_CONTRAST_MIN,
): string {
  if (!isValidHex(accent) || !isValidHex(primary) || !isValidHex(pageBg)) return accent
  const { cardBg } = deriveThemeColors(primary.trim(), accent.trim(), pageBg.trim())
  return adjustHexForContrast(accent, cardBg, minRatio)
}

/** Avisos de contraste WCAG — informativos; não bloqueiam salvamento. */
export function getThemeContrastWarnings(
  colors: { primary?: string; accent?: string },
  pageBgHex: string,
): string[] {
  const primary = colors.primary?.trim()
  const accent = colors.accent?.trim()
  if (!primary || !accent || !isValidHex(pageBgHex)) return []

  const derived = deriveThemeColors(primary, accent, pageBgHex)

  const pairs: [string, string, string][] = [
    ['texto principal', derived.textPrimary, derived.cardBg],
    ['botão', derived.buttonText, derived.buttonBg],
    ['preço', derived.pricePrimary, derived.cardBg],
    ['primária', derived.primary, pageBgHex],
    ['destaque', derived.accent, pageBgHex],
  ]

  const warnings: string[] = []
  for (const [label, fg, bg] of pairs) {
    if (!meetsWcagAA(fg, bg)) {
      warnings.push(`Contraste insuficiente em ${label} (mínimo WCAG AA 4.5:1)`)
    }
  }
  if (!meetsMinContrast(derived.accent, derived.cardBg, CARD_ACCENT_CONTRAST_MIN)) {
    warnings.push(
      `Contraste insuficiente em destaque nos cards (mínimo ${CARD_ACCENT_CONTRAST_MIN}:1)`,
    )
  }
  return warnings
}

/** Valida apenas formato hex — erros de formato ainda bloqueiam o save. */
export function validateThemeColors(
  colors: { primary?: string; accent?: string; pageBg?: string },
): { ok: true } | { ok: false; message: string } {
  for (const [key, value] of Object.entries(colors)) {
    if (value == null || value === '') continue
    if (!isValidHex(value)) {
      return { ok: false, message: `Cor ${key} inválida (use formato #RRGGBB)` }
    }
  }
  return { ok: true }
}

export function hexWithAlpha(hex: string, alphaHex: string): string {
  const e = expandHex(hex)
  return `${e}${alphaHex}`
}
