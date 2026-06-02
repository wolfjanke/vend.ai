import {
  getTheme,
  themeToCardConfig,
  type ThemeBackground,
  type ThemeDefinition,
  type ThemeName,
  type StoreThemeConfig,
} from '@/lib/themes'
import { getGoogleFontsUrl } from '@/lib/theme-fonts'
import { deriveThemeColors } from '@/lib/theme-derive'
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
    primary?: string | null
    accent?:   string | null
  },
  background: ThemeBackground,
  shimmer: boolean,
): string {
  const primary = customColors.primary?.trim() || theme.defaultColors.primary
  const accent = customColors.accent?.trim() || theme.defaultColors.accent
  const pageBg =
    background === 'dark'
      ? theme.defaultColors.background
      : theme.defaultColors.backgroundLight

  const c = deriveThemeColors(primary, accent, background, pageBg)
  const shadow =
    background === 'dark'
      ? '0 4px 20px rgba(0,0,0,0.4)'
      : '0 4px 20px rgba(0,0,0,0.08)'
  const popShadow =
    theme.name === 'pop'
      ? `0 8px 32px ${hexWithAlpha(accent, '44')}`
      : shadow

  return `
    --theme-primary: ${c.primary};
    --theme-secondary: ${c.secondary};
    --theme-accent: ${c.accent};
    --theme-bg: ${c.pageBg};

    --theme-primary-dark: ${c.primaryDark};
    --theme-primary-light: ${c.primaryLight};
    --theme-primary-muted: ${c.primaryMuted};
    --theme-primary-surface: ${c.primarySurface};
    --theme-primary-border: ${c.primaryBorder};

    --theme-text: ${c.textPrimary};
    --theme-text-secondary: ${c.textSecondary};
    --theme-text-muted: ${c.textMuted};

    --theme-card-bg: ${c.cardBg};
    --theme-card-bg-hover: ${c.cardBgHover};
    --theme-card-border: ${c.cardBorder};
    --theme-card-border-hover: ${c.cardBorderHover};
    --theme-card-radius: ${theme.card.borderRadius};
    --theme-card-ratio: ${theme.card.aspectRatio};

    --theme-header-bg: ${c.headerBg};
    --theme-header-text: ${c.headerText};

    --theme-chip-bg: ${c.chipBg};
    --theme-chip-bg-active: ${c.chipBgActive};
    --theme-chip-text: ${c.chipText};
    --theme-chip-text-active: ${c.chipTextActive};

    --theme-btn-bg: ${c.buttonBg};
    --theme-btn-text: ${c.buttonText};
    --theme-btn-hover: ${c.buttonHover};

    --theme-price: ${c.pricePrimary};
    --theme-price-old: ${c.priceOld};

    --theme-vi-avatar: ${c.viAvatar};
    --theme-vi-bubble: ${c.viBubbleBg};

    --theme-font-display: '${theme.fonts.display}', sans-serif;
    --theme-font-body: '${theme.fonts.body}', sans-serif;
    --theme-font-weight: ${theme.fonts.displayWeight};
    --theme-font-weight-display: ${theme.fonts.displayWeight};

    --theme-shimmer: ${shimmer ? '1' : '0'};
    --theme-shadow: ${popShadow};

    --theme-radius: ${theme.card.borderRadius};
    --theme-surface: ${c.surface};
    --theme-text-muted: ${c.textMuted};

    --bg: ${c.pageBg};
    --surface: ${c.surface};
    --surface2: ${c.surface2};
    --surface3: ${c.surface3};
    --border: ${c.border};
    --primary: ${c.primary};
    --primary-dim: ${hexWithAlpha(c.primary, '22')};
    --primary-glow: ${hexWithAlpha(c.primary, '55')};
    --accent: ${c.accent};
    --accent-dim: ${hexWithAlpha(c.accent, '15')};
    --accent-glow: ${hexWithAlpha(c.accent, '44')};
    --text: ${c.textPrimary};
    --muted: ${c.textMuted};
    --faint: ${c.faint};
    background-color: ${c.pageBg};
    color: ${c.textPrimary};
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
      primary: row.theme_primary_color,
      accent:  row.theme_accent_color,
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
