import {
  getTheme,
  themeToCardConfig,
  type ThemeBackground,
  type ThemeDefinition,
  type ThemeName,
  type StoreThemeConfig,
} from '@/lib/themes'
import { getGoogleFontsUrl } from '@/lib/theme-fonts'
import { hexWithAlpha } from '@/lib/theme-contrast'

export type StoreThemeRow = {
  theme_name?:              string | null
  theme_primary_color?:     string | null
  theme_secondary_color?:   string | null
  theme_accent_color?:      string | null
  theme_background?:        string | null
  theme_shimmer?:           boolean | null
  theme_logo_url?:          string | null
  logo_url?:                string | null
}

export function generateThemeCss(
  theme: ThemeDefinition,
  customColors: {
    primary?:   string | null
    secondary?: string | null
    accent?:    string | null
  },
  background: ThemeBackground,
  shimmer: boolean,
): string {
  const primary = customColors.primary?.trim() || theme.defaultColors.primary
  const secondary = customColors.secondary?.trim() || theme.defaultColors.secondary
  const accent = customColors.accent?.trim() || theme.defaultColors.accent

  const isDark = background === 'dark'
  const lightPaletteThemes = new Set<ThemeName>(['boutique', 'editorial', 'pop'])
  const bg = isDark ? theme.defaultColors.background : theme.defaultColors.backgroundLight
  const surface = isDark
    ? (lightPaletteThemes.has(theme.name) ? '#1A1A1A' : theme.defaultColors.surface)
    : theme.defaultColors.surface
  const surface2 = isDark ? '#1A1A2E' : '#EDE8E4'
  const border = isDark ? '#2A2A45' : '#D8D0C8'
  const text = isDark
    ? (lightPaletteThemes.has(theme.name) ? '#F5F5F5' : theme.defaultColors.text)
    : theme.defaultColors.text
  const muted = isDark && lightPaletteThemes.has(theme.name)
    ? '#AAAAAA'
    : theme.defaultColors.textMuted
  const faint = isDark ? '#33334A' : '#C8C0B8'

  return `
    --theme-primary: ${primary};
    --theme-secondary: ${secondary};
    --theme-accent: ${accent};
    --theme-bg: ${bg};
    --theme-surface: ${surface};
    --theme-text: ${text};
    --theme-text-muted: ${muted};
    --theme-radius: ${theme.card.borderRadius};
    --theme-font-display: '${theme.fonts.display}', sans-serif;
    --theme-font-body: '${theme.fonts.body}', sans-serif;
    --theme-font-weight: ${theme.fonts.displayWeight};
    --theme-shimmer: ${shimmer ? '1' : '0'};
    --theme-card-ratio: ${theme.card.aspectRatio};
    --bg: ${bg};
    --surface: ${surface};
    --surface2: ${surface2};
    --surface3: ${isDark ? '#22223A' : '#E5E0DA'};
    --border: ${border};
    --primary: ${primary};
    --primary-dim: ${hexWithAlpha(primary, '22')};
    --primary-glow: ${hexWithAlpha(primary, '55')};
    --accent: ${accent};
    --accent-dim: ${hexWithAlpha(accent, '15')};
    --accent-glow: ${hexWithAlpha(accent, '44')};
    --text: ${text};
    --muted: ${muted};
    --faint: ${faint};
    background-color: ${bg};
    color: ${text};
  `.trim()
}

export function resolveStoreTheme(row: StoreThemeRow): {
  theme:       ThemeDefinition
  themeName:   ThemeName
  background:  ThemeBackground
  shimmer:     boolean
  css:         string
  fontUrl:     string
  cardTheme:   StoreThemeConfig
  displayLogo: string | null
} {
  const themeName = (row.theme_name ?? 'default') as ThemeName
  const theme = getTheme(themeName)
  const background = (row.theme_background ?? theme.defaultBackground) as ThemeBackground
  const shimmer = Boolean(row.theme_shimmer)

  const css = generateThemeCss(
    theme,
    {
      primary:   row.theme_primary_color,
      secondary: row.theme_secondary_color,
      accent:    row.theme_accent_color,
    },
    background,
    shimmer,
  )

  return {
    theme,
    themeName,
    background,
    shimmer,
    css,
    fontUrl:     getGoogleFontsUrl(theme),
    cardTheme:   themeToCardConfig(theme, shimmer),
    displayLogo: row.theme_logo_url?.trim() || row.logo_url?.trim() || null,
  }
}
