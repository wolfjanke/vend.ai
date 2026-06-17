import { resolveCatalogColsMobile } from '@/lib/vitrine-layout'
import type { PlanSlug } from '@/lib/plans'
import {
  getTheme,
  themeToCardConfig,
  type ThemeBackground,
  type ThemeDefinition,
  type ThemeName,
  type StoreThemeConfig,
} from '@/lib/themes'
import { getGoogleFontsUrl, resolveThemeShadow } from '@/lib/theme-fonts'
import { deriveThemeColors } from '@/lib/theme-derive'
import { hexWithAlpha } from '@/lib/theme-contrast'
import { getThemeTypography, themeTypographyCssVars } from '@/lib/theme-typography'

export type StoreThemeRow = {
  theme_name?:              string | null
  theme_primary_color?:     string | null
  theme_secondary_color?:   string | null
  theme_accent_color?:      string | null
  theme_background?:        string | null
  theme_shimmer?:           boolean | null
  theme_logo_url?:          string | null
  logo_url?:                string | null
  plan?:                    string | null
  settings_json?:           import('@/types').StoreSettings | null
}

export type ThemeCssOverrides = {
  catalogColsMobile?: number
}

export function generateThemeCss(
  theme: ThemeDefinition,
  customColors: {
    primary?: string | null
    accent?:   string | null
  },
  background: ThemeBackground,
  shimmer: boolean,
  overrides?: ThemeCssOverrides,
): string {
  const primary = customColors.primary?.trim() || theme.defaultColors.primary
  const accent = customColors.accent?.trim() || theme.defaultColors.accent
  const pageBg =
    background === 'dark'
      ? theme.defaultColors.background
      : theme.defaultColors.backgroundLight

  const c = deriveThemeColors(primary, accent, background, pageBg, {
    text:      background === 'light' ? theme.defaultColors.text : undefined,
    textMuted: background === 'light' ? theme.defaultColors.textMuted : undefined,
  })
  const typography = themeTypographyCssVars(getThemeTypography(theme.name))
  const themeShadow = resolveThemeShadow(theme.shadowStyle, background, accent)
  const priceColor = theme.priceColor ?? c.pricePrimary
  const overlayGradient =
    theme.card.overlayGradient ??
    'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)'
  const accentGradient =
    theme.accentGradient ??
    `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)`

  const catalogColsMobile = overrides?.catalogColsMobile ?? theme.catalogColsMobile

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
    --theme-header-letter-spacing: ${theme.headerLetterSpacing ?? 'normal'};

    --theme-chip-bg: ${c.chipBg};
    --theme-chip-bg-active: ${c.chipBgActive};
    --theme-chip-text: ${c.chipText};
    --theme-chip-text-active: ${c.chipTextActive};

    --theme-btn-bg: ${c.buttonBg};
    --theme-btn-text: ${c.buttonText};
    --theme-btn-hover: ${c.buttonHover};
    --theme-btn-radius: ${theme.buttonRadius};

    --theme-price: ${priceColor};
    --theme-price-old: ${c.priceOld};

    --theme-vi-avatar: ${c.viAvatar};
    --theme-vi-bubble: ${c.viBubbleBg};

    --theme-font-display: '${theme.fonts.display}', sans-serif;
    --theme-font-body: '${theme.fonts.body}', sans-serif;
    --theme-font-weight: ${theme.fonts.displayWeight};
    --theme-font-weight-display: ${theme.fonts.displayWeight};

    --theme-shimmer: ${shimmer ? '1' : '0'};
    --theme-shadow: ${themeShadow};
    --theme-card-hover: ${theme.cardHover};
    --theme-overlay-gradient: ${overlayGradient};
    --theme-accent-gradient: ${accentGradient};

    --theme-card-gap: ${theme.spacing.cardGap};
    --theme-section-gap: ${theme.spacing.sectionGap};
    --theme-page-padding: ${theme.spacing.pagePadding};
    --theme-catalog-cols-mobile: ${catalogColsMobile};
    --theme-catalog-cols-desktop: ${theme.catalogColsDesktop};
    --theme-catalog-layout: ${theme.catalogLayout};

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

    ${typography}
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
  catalogColsMobile: number
} {
  const themeName = (row.theme_name ?? 'default') as ThemeName
  const theme = getTheme(themeName)
  const background = (row.theme_background ?? theme.defaultBackground) as ThemeBackground
  const shimmer = Boolean(row.theme_shimmer)
  const plan = (row.plan ?? 'free') as PlanSlug
  const catalogColsMobile = resolveCatalogColsMobile(
    themeName,
    row.settings_json ?? undefined,
    plan,
  )

  const css = generateThemeCss(
    theme,
    {
      primary: row.theme_primary_color,
      accent:  row.theme_accent_color,
    },
    background,
    shimmer,
    { catalogColsMobile },
  )

  return {
    theme,
    themeName,
    background,
    shimmer,
    css,
    fontUrl:     getGoogleFontsUrl(theme),
    cardTheme:   themeToCardConfig(theme, shimmer),
    displayLogo: row.logo_url?.trim() || row.theme_logo_url?.trim() || null,
    catalogColsMobile,
  }
}
