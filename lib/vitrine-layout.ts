import type { PlanSlug } from '@/lib/plans'
import { isPaidPlan } from '@/lib/plans'
import { getTheme, type CatalogLayout, type ThemeName } from '@/lib/themes'
import type { StoreSettings } from '@/types'

export type HeaderLayout = 'bar' | 'centered'
export type LogoShape = 'rect' | 'square' | 'circle'
export type BrandDisplay = 'logo-and-name' | 'logo-only' | 'name-only'
export type MobileGridCols = 2 | 3

/** Temas em que o lojista pode alternar 2 ↔ 3 colunas no mobile. */
export const THEMES_WITH_MOBILE_GRID_OVERRIDE: ThemeName[] = ['flash', 'pop']

/** Temas que já usam 3 colunas por padrão (informar no admin, sem toggle). */
export const THEMES_NATIVE_THREE_COLS: ThemeName[] = ['social']

const GRID_LAYOUTS: CatalogLayout[] = ['grid', 'grid-dense']

export function normalizeHeaderLayout(raw: unknown): HeaderLayout {
  return raw === 'centered' ? 'centered' : 'bar'
}

export function normalizeLogoShape(raw: unknown): LogoShape {
  if (raw === 'square' || raw === 'circle') return raw
  return 'rect'
}

export function normalizeBrandDisplay(raw: unknown, hasLogo: boolean): BrandDisplay {
  if (raw === 'logo-only' || raw === 'name-only') return raw
  if (!hasLogo) return 'name-only'
  return 'logo-and-name'
}

export function normalizeShowSearch(raw: unknown): boolean {
  if (raw === false) return false
  return true
}

export function normalizeMobileGridCols(raw: unknown): MobileGridCols | undefined {
  if (raw === 3 || raw === '3') return 3
  if (raw === 2 || raw === '2') return 2
  return undefined
}

export function themeSupportsMobileGridOverride(
  themeName: ThemeName,
  catalogLayout: CatalogLayout,
): boolean {
  if (!GRID_LAYOUTS.includes(catalogLayout)) return false
  return THEMES_WITH_MOBILE_GRID_OVERRIDE.includes(themeName)
}

export function themeHasNativeThreeCols(themeName: ThemeName): boolean {
  return THEMES_NATIVE_THREE_COLS.includes(themeName)
}

export function canUseCenteredHeader(plan: PlanSlug): boolean {
  return isPaidPlan(plan)
}

export function canUseMobileGridColsOverride(plan: PlanSlug): boolean {
  return isPaidPlan(plan)
}

export function resolveHeaderLayout(
  settings: StoreSettings | null | undefined,
  plan: PlanSlug,
): HeaderLayout {
  const layout = normalizeHeaderLayout(settings?.headerLayout)
  if (layout === 'centered' && !canUseCenteredHeader(plan)) return 'bar'
  return layout
}

export function resolveCatalogColsMobile(
  themeName: ThemeName,
  settings: StoreSettings | null | undefined,
  plan: PlanSlug,
): number {
  const theme = getTheme(themeName)
  const base = theme.catalogColsMobile

  if (themeHasNativeThreeCols(themeName)) return base

  const override = normalizeMobileGridCols(settings?.mobileGridCols)
  if (override == null) return base

  if (!themeSupportsMobileGridOverride(themeName, theme.catalogLayout)) return base
  if (!canUseMobileGridColsOverride(plan)) return base

  return override
}

export type VitrineLayoutConfig = {
  headerLayout:   HeaderLayout
  logoShape:      LogoShape
  brandDisplay:   BrandDisplay
  showSearch:     boolean
  mobileGridCols: number
}

export function resolveVitrineLayout(
  settings: StoreSettings | null | undefined,
  plan: PlanSlug,
  themeName: ThemeName,
  hasLogo: boolean,
): VitrineLayoutConfig {
  const mobileGridCols = resolveCatalogColsMobile(themeName, settings, plan)

  return {
    headerLayout:   resolveHeaderLayout(settings, plan),
    logoShape:      normalizeLogoShape(settings?.logoShape),
    brandDisplay:   normalizeBrandDisplay(settings?.brandDisplay, hasLogo),
    showSearch:     normalizeShowSearch(settings?.showSearch),
    mobileGridCols,
  }
}
