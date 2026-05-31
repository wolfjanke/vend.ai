import type { ThemeDefinition } from '@/lib/themes'

const ALL_THEME_FONTS = [
  'Syne',
  'DM Sans',
  'Playfair Display',
  'Bebas Neue',
  'Cormorant Garamond',
  'Cormorant',
  'Nunito',
  'Barlow Condensed',
] as const

export function getGoogleFontsUrl(theme: ThemeDefinition): string {
  const families = [theme.fonts.display, theme.fonts.body]
    .filter((v, i, a) => a.indexOf(v) === i)
    .map(f => {
      const name = f.replace(/ /g, '+')
      const weights =
        f === theme.fonts.display
          ? `:wght@${theme.fonts.displayWeight};${theme.fonts.displayWeight + 100}`
          : ':wght@300;400;500;600;700'
      return `family=${name}${weights}`
    })
    .join('&')

  return `https://fonts.googleapis.com/css2?${families}&display=swap`
}

/** URL única com todas as fontes — preview no admin. */
export function getAllThemesFontsUrl(): string {
  const parts = ALL_THEME_FONTS.map(f => {
    const name = f.replace(/ /g, '+')
    if (f === 'Bebas Neue') return `family=${name}`
    if (f === 'Cormorant Garamond' || f === 'Cormorant') return `family=${name}:wght@300;400;600`
    return `family=${name}:wght@300;400;500;600;700;800`
  })
  return `https://fonts.googleapis.com/css2?${parts.join('&')}&display=swap`
}
