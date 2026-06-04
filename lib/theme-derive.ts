import type { ThemeBackground } from '@/lib/themes'

interface DerivedThemeColors {
  primary: string
  accent: string
  background: ThemeBackground

  primaryDark: string
  primaryLight: string
  primaryMuted: string
  primarySurface: string
  primaryBorder: string

  textPrimary: string
  textSecondary: string
  textMuted: string

  cardBg: string
  cardBgHover: string
  cardBorder: string
  cardBorderHover: string

  headerBg: string
  headerText: string

  chipBg: string
  chipBgActive: string
  chipText: string
  chipTextActive: string

  buttonBg: string
  buttonText: string
  buttonHover: string

  pricePrimary: string
  priceOld: string

  viAvatar: string
  viBubbleBg: string

  /** Alias legado / DB */
  secondary: string
  surface: string
  surface2: string
  surface3: string
  border: string
  faint: string
  pageBg: string
}

const HEX_RE = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/

export function expandHex(hex: string): string {
  const h = hex.trim()
  if (!HEX_RE.test(h)) return h
  if (h.length === 7) return h.toUpperCase()
  const r = h[1] + h[1]
  const g = h[2] + h[2]
  const b = h[3] + h[3]
  return `#${r}${g}${b}`.toUpperCase()
}

function hexToHsl(hex: string): [number, number, number] {
  const { r, g, b } = hexToRgb(expandHex(hex))
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
        break
      case gn:
        h = ((bn - rn) / d + 2) / 6
        break
      default:
        h = ((rn - gn) / d + 4) / 6
    }
  }

  return [h * 360, s * 100, l * 100]
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const e = expandHex(hex).slice(1)
  return {
    r: parseInt(e.slice(0, 2), 16),
    g: parseInt(e.slice(2, 4), 16),
    b: parseInt(e.slice(4, 6), 16),
  }
}

function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100
  const ln = l / 100
  const c = (1 - Math.abs(2 * ln - 1)) * sn
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = ln - c / 2
  let r = 0
  let g = 0
  let b = 0

  if (h < 60) {
    r = c; g = x; b = 0
  } else if (h < 120) {
    r = x; g = c; b = 0
  } else if (h < 180) {
    r = 0; g = c; b = x
  } else if (h < 240) {
    r = 0; g = x; b = c
  } else if (h < 300) {
    r = x; g = 0; b = c
  } else {
    r = c; g = 0; b = x
  }

  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}

function lighten(hex: string, amount: number): string {
  const [h, s, l] = hexToHsl(hex)
  return hslToHex(h, s, Math.min(100, l + amount))
}

function darken(hex: string, amount: number): string {
  const [h, s, l] = hexToHsl(hex)
  return hslToHex(h, s, Math.max(0, l - amount))
}

function alpha(hex: string, opacity: number): string {
  const { r, g, b } = hexToRgb(expandHex(hex))
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(expandHex(hex))
  const lin = [r, g, b].map(v => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * lin[0]! + 0.7152 * lin[1]! + 0.0722 * lin[2]!
}

/** Cor “clara” para texto de botão (luminância relativa WCAG). */
export function isLight(hex: string): boolean {
  return relativeLuminance(hex) > 0.55
}

export function deriveThemeColors(
  primary: string,
  accent: string,
  background: ThemeBackground,
  pageBgFallback?: string,
): DerivedThemeColors {
  const p = expandHex(primary)
  const a = expandHex(accent)
  const isDark = background === 'dark'

  const pageBg = pageBgFallback ?? (isDark ? '#08080F' : '#FAFAF8')
  const cardBg = isDark ? lighten(pageBg, 8) : darken('#FFFFFF', 3)
  const cardBgHover = isDark ? lighten(pageBg, 12) : darken('#FFFFFF', 6)
  const surface2 = isDark ? lighten(pageBg, 14) : darken('#FFFFFF', 8)
  const surface3 = isDark ? lighten(pageBg, 18) : darken('#FFFFFF', 12)
  const border = isDark ? alpha(p, 0.15) : alpha(p, 0.2)
  const faint = isDark ? '#33334A' : '#C8C0B8'

  return {
    primary: p,
    accent: a,
    background,

    primaryDark: darken(p, 15),
    primaryLight: lighten(p, 15),
    primaryMuted: alpha(p, 0.6),
    primarySurface: alpha(p, 0.1),
    primaryBorder: alpha(p, 0.2),

    textPrimary: isDark ? '#F0F0FF' : '#1A1A2E',
    textSecondary: isDark ? '#AAAACC' : '#4A4A6A',
    textMuted: isDark ? '#666688' : '#8888AA',

    cardBg,
    cardBgHover,
    cardBorder: border,
    cardBorderHover: alpha(p, 0.5),

    headerBg: isDark ? alpha('#000000', 0.9) : alpha('#FFFFFF', 0.95),
    headerText: isDark ? '#F0F0FF' : '#1A1A2E',

    chipBg: isDark ? alpha('#FFFFFF', 0.08) : alpha('#000000', 0.06),
    chipBgActive: alpha(p, 0.15),
    chipText: isDark ? '#AAAACC' : '#4A4A6A',
    chipTextActive: p,

    buttonBg: p,
    buttonText: isLight(p) ? '#1A1A2E' : '#FFFFFF',
    buttonHover: darken(p, 10),

    pricePrimary: a,
    priceOld: isDark ? '#555577' : '#AAAAAA',

    viAvatar: `linear-gradient(135deg, ${p}, ${a})`,
    viBubbleBg: isDark ? alpha(p, 0.12) : alpha(p, 0.08),

    secondary: darken(p, 15),
    surface: cardBg,
    surface2,
    surface3,
    border,
    faint,
    pageBg,
  }
}
