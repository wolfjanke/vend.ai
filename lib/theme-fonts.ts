import type { ThemeDefinition, ShadowStyle, ThemeBackground } from '@/lib/themes'
import { hexWithAlpha } from '@/lib/theme-contrast'

const ALL_THEME_FONTS = [
  'Syne',
  'DM Sans',
  'Inter',
  'Playfair Display',
  'Libre Baskerville',
  'Bebas Neue',
  'Cormorant Garamond',
  'Cormorant',
  'Nunito',
  'Barlow',
  'Barlow Condensed',
  'Outfit',
  'Lora',
  'Jost',
] as const

function fontWeights(f: string, theme: ThemeDefinition): string {
  const name = f.replace(/ /g, '+')
  if (f === 'Bebas Neue') return `family=${name}`
  if (f === theme.fonts.display) {
    const w = theme.fonts.displayWeight
    return `family=${name}:wght@${w};${Math.min(w + 100, 900)}`
  }
  if (f === 'Cormorant Garamond' || f === 'Cormorant' || f === 'Libre Baskerville') {
    return `family=${name}:wght@300;400;600`
  }
  if (f === 'Inter') return `family=${name}:wght@300;400;500;600;700`
  return `family=${name}:wght@300;400;500;600;700;800`
}

export function getGoogleFontsUrl(theme: ThemeDefinition): string {
  const families = [theme.fonts.display, theme.fonts.body]
    .filter((v, i, a) => a.indexOf(v) === i)
    .map(f => fontWeights(f, theme))
    .join('&')

  return `https://fonts.googleapis.com/css2?${families}&display=swap`
}

/** URL única com todas as fontes — preview no admin. */
export function getAllThemesFontsUrl(): string {
  const parts = ALL_THEME_FONTS.map(f => {
    const name = f.replace(/ /g, '+')
    if (f === 'Bebas Neue') return `family=${name}`
    if (f === 'Cormorant Garamond' || f === 'Cormorant' || f === 'Libre Baskerville') {
      return `family=${name}:wght@300;400;600`
    }
    if (f === 'Inter') return `family=${name}:wght@300;400;500;600;700`
    return `family=${name}:wght@300;400;500;600;700;800`
  })
  return `https://fonts.googleapis.com/css2?${parts.join('&')}&display=swap`
}

export function resolveThemeShadow(
  shadowStyle: ShadowStyle,
  background: ThemeBackground,
  accent: string,
): string {
  switch (shadowStyle) {
    case 'none':
      return 'none'
    case 'light':
      return background === 'dark'
        ? '0 2px 8px rgba(0,0,0,0.35)'
        : '0 2px 8px rgba(0,0,0,0.08)'
    case 'medium':
      return background === 'dark'
        ? '0 4px 16px rgba(0,0,0,0.45)'
        : '0 4px 16px rgba(0,0,0,0.10)'
    case 'heavy':
      return background === 'dark'
        ? '0 2px 12px rgba(0,0,0,0.5)'
        : '0 2px 12px rgba(0,0,0,0.12)'
    case 'glow':
      return `0 0 20px ${hexWithAlpha(accent, '4D')}`
    default:
      return 'none'
  }
}
