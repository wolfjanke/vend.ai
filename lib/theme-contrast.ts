import { deriveThemeColors } from '@/lib/theme-derive'
import type { ThemeBackground } from '@/lib/themes'

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

export function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg)
  const l2 = relativeLuminance(bg)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

export function meetsWcagAA(fg: string, bg: string): boolean {
  return contrastRatio(fg, bg) >= 4.5
}

export function validateThemeColors(
  colors: { primary?: string; accent?: string },
  background: ThemeBackground,
  pageBgHex: string,
): { ok: true } | { ok: false; message: string } {

  for (const [key, value] of Object.entries(colors)) {
    if (value == null || value === '') continue
    if (!isValidHex(value)) {
      return { ok: false, message: `Cor ${key} inválida (use formato #RRGGBB)` }
    }
  }

  const primary = colors.primary?.trim()
  const accent = colors.accent?.trim()
  if (!primary || !accent) return { ok: true }

  const derived = deriveThemeColors(primary, accent, background, pageBgHex)

  const pairs: [string, string, string][] = [
    ['texto principal', derived.textPrimary, derived.cardBg],
    ['botão', derived.buttonText, derived.buttonBg],
    ['preço', derived.pricePrimary, derived.cardBg],
    ['primária', derived.primary, pageBgHex],
    ['destaque', derived.accent, pageBgHex],
  ]

  for (const [label, fg, bg] of pairs) {
    if (!meetsWcagAA(fg, bg)) {
      return {
        ok:      false,
        message: `Contraste insuficiente em ${label} (mínimo WCAG AA 4.5:1)`,
      }
    }
  }

  return { ok: true }
}

export function hexWithAlpha(hex: string, alphaHex: string): string {
  const e = expandHex(hex)
  return `${e}${alphaHex}`
}
