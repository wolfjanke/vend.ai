import { expandHex, isLight } from '@/lib/theme-derive'

import { isValidHex } from '@/lib/theme-contrast'

import { getTheme, type ThemeBackground, type ThemeDefinition, type ThemeName } from '@/lib/themes'



export type ThemeDefaultPalette = {

  primary: string

  accent:  string

  pageBg:  string

}



export function defaultPageBgForTheme(

  theme: ThemeDefinition,

  background: ThemeBackground = theme.defaultBackground,

): string {

  return expandHex(

    background === 'dark'

      ? theme.defaultColors.background

      : theme.defaultColors.backgroundLight,

  )

}



export function getThemeDefaultPalette(theme: ThemeDefinition): ThemeDefaultPalette {

  return {

    primary: expandHex(theme.defaultColors.primary),

    accent:  expandHex(theme.defaultColors.accent),

    pageBg:  defaultPageBgForTheme(theme, theme.defaultBackground),

  }

}



function normalizePaletteHex(hex: string): string {

  const trimmed = hex.trim()

  if (!isValidHex(trimmed)) return trimmed.toUpperCase()

  return expandHex(trimmed)

}



export function palettesMatch(

  a: ThemeDefaultPalette,

  b: ThemeDefaultPalette,

): boolean {

  return (

    normalizePaletteHex(a.primary) === normalizePaletteHex(b.primary) &&

    normalizePaletteHex(a.accent) === normalizePaletteHex(b.accent) &&

    normalizePaletteHex(a.pageBg) === normalizePaletteHex(b.pageBg)

  )

}



/** Compara cores atuais com o padrão do tema informado. */

export function colorsMatchThemeDefaults(

  themeName: ThemeName | string,

  primary: string,

  accent: string,

  pageBg: string,

): boolean {

  const defaults = getThemeDefaultPalette(getTheme(themeName))

  return palettesMatch(defaults, {

    primary,

    accent,

    pageBg,

  })

}



/** Hex efetivo do fundo: custom > legacy light/dark do template. */

export function resolveThemePageBg(

  theme: ThemeDefinition,

  opts: {

    themePageBgColor?: string | null

    themeBackground?: ThemeBackground | string | null

  },

): string {

  const custom = opts.themePageBgColor?.trim()

  if (custom && isValidHex(custom)) {

    return expandHex(custom)

  }



  const legacy = opts.themeBackground

  const background: ThemeBackground =

    legacy === 'light' || legacy === 'dark'

      ? legacy

      : theme.defaultBackground



  return defaultPageBgForTheme(theme, background)

}



export function inferThemeBackground(pageBg: string): ThemeBackground {

  return isLight(expandHex(pageBg)) ? 'light' : 'dark'

}

/** Aviso suave quando o fundo escolhido foge do perfil do layout. */
export function getPageBgThemeHarmonyWarning(
  theme: ThemeDefinition,
  pageBg: string,
): string | null {
  if (!isValidHex(pageBg)) return null
  const light = isLight(pageBg)
  if (light && !theme.allowLightBackground) {
    return `O layout ${theme.label} foi pensado para fundo escuro — textos e cards podem ficar estranhos.`
  }
  if (!light && !theme.allowDarkBackground) {
    return `O layout ${theme.label} foi pensado para fundo claro — textos e cards podem ficar estranhos.`
  }
  return null
}

