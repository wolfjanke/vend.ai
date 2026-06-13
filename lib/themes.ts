import type { PlanSlug } from '@/lib/plans'

export type ThemeName =
  | 'default'
  | 'boutique'
  | 'street'
  | 'editorial'
  | 'pop'
  | 'fitness'
  | 'lumiere'

export type ThemeBackground = 'light' | 'dark'

export type CardInfoPosition = 'below' | 'overlay' | 'hover' | 'badge' | 'sidebar'

export interface ThemeDefinition {
  name:                 ThemeName
  label:                string
  description:          string
  forSegments:          string[]
  defaultBackground:    ThemeBackground
  allowLightBackground: boolean
  allowDarkBackground:  boolean
  fonts: {
    display:       string
    body:          string
    displayWeight: number
  }
  card: {
    aspectRatio:      '3/4' | '1/1' | '4/5'
    infoPosition:     CardInfoPosition
    borderRadius:     string
    shadow:           boolean
    overlayGradient?: string
  }
  defaultColors: {
    primary:         string
    secondary:       string
    accent:          string
    background:      string
    backgroundLight: string
    surface:         string
    text:            string
    textMuted:       string
  }
  shimmerAvailable: boolean
  planRequired:     PlanSlug
}

export const THEMES: Record<ThemeName, ThemeDefinition> = {
  default: {
    name:                 'default',
    label:                'vend.ai',
    description:          'Tema padrão da plataforma',
    forSegments:          ['todos'],
    defaultBackground:    'dark',
    allowLightBackground: false,
    allowDarkBackground:  true,
    fonts:                { display: 'Syne', body: 'DM Sans', displayWeight: 700 },
    card: {
      aspectRatio:  '3/4',
      infoPosition: 'below',
      borderRadius: '16px',
      shadow:       false,
    },
    defaultColors: {
      primary:         '#7B6EFF',
      secondary:       '#5A4FCC',
      accent:          '#00E5A0',
      background:      '#08080F',
      backgroundLight: '#F5F5FF',
      surface:         '#11111C',
      text:            '#EEEEFF',
      textMuted:       '#7777AA',
    },
    shimmerAvailable: false,
    planRequired:     'free',
  },
  boutique: {
    name:                 'boutique',
    label:                'Boutique',
    description:          'Elegante e sofisticado para moda feminina adulta',
    forSegments:          ['moda_feminina', 'moda_adulta'],
    defaultBackground:    'light',
    allowLightBackground: true,
    allowDarkBackground:  true,
    fonts:                { display: 'Playfair Display', body: 'DM Sans', displayWeight: 600 },
    card: {
      aspectRatio:  '3/4',
      infoPosition: 'below',
      borderRadius: '12px',
      shadow:       true,
    },
    defaultColors: {
      primary:         '#8B6F5E',
      secondary:       '#C4A882',
      accent:          '#D4AF7A',
      background:      '#1A1209',
      backgroundLight: '#FAF7F4',
      surface:         '#F5EFE8',
      text:            '#2C1810',
      textMuted:       '#8B7355',
    },
    shimmerAvailable: false,
    planRequired:     'starter',
  },
  street: {
    name:                 'street',
    label:                'Street',
    description:          'Bold e urbano para streetwear e moda jovem',
    forSegments:          ['streetwear', 'moda_jovem', 'moda_unisex'],
    defaultBackground:    'dark',
    allowLightBackground: false,
    allowDarkBackground:  true,
    fonts:                { display: 'Bebas Neue', body: 'DM Sans', displayWeight: 400 },
    card: {
      aspectRatio:     '1/1',
      infoPosition:    'overlay',
      borderRadius:    '0px',
      shadow:          false,
      overlayGradient: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)',
    },
    defaultColors: {
      primary:         '#FF2D20',
      secondary:       '#FF6B35',
      accent:          '#F5FF00',
      background:      '#0A0A0A',
      backgroundLight: '#F0F0F0',
      surface:         '#141414',
      text:            '#FFFFFF',
      textMuted:       '#888888',
    },
    shimmerAvailable: false,
    planRequired:     'starter',
  },
  editorial: {
    name:                 'editorial',
    label:                'Editorial',
    description:          'Minimalista e premium para marcas sofisticadas',
    forSegments:          ['moda_premium', 'moda_feminina', 'moda_adulta'],
    defaultBackground:    'light',
    allowLightBackground: true,
    allowDarkBackground:  true,
    fonts:                { display: 'Cormorant Garamond', body: 'DM Sans', displayWeight: 300 },
    card: {
      aspectRatio:  '4/5',
      infoPosition: 'hover',
      borderRadius: '4px',
      shadow:       false,
    },
    defaultColors: {
      primary:         '#1A1A1A',
      secondary:       '#4A4A4A',
      accent:          '#8B7355',
      background:      '#111111',
      backgroundLight: '#FAFAFA',
      surface:         '#F5F5F5',
      text:            '#1A1A1A',
      textMuted:       '#888888',
    },
    shimmerAvailable: false,
    planRequired:     'starter',
  },
  pop: {
    name:                 'pop',
    label:                'Pop',
    description:          'Divertido e colorido para moda jovem e infantil',
    forSegments:          ['moda_infantil', 'moda_jovem'],
    defaultBackground:    'light',
    allowLightBackground: true,
    allowDarkBackground:  false,
    fonts:                { display: 'Nunito', body: 'Nunito', displayWeight: 800 },
    card: {
      aspectRatio:  '1/1',
      infoPosition: 'badge',
      borderRadius: '24px',
      shadow:       true,
    },
    defaultColors: {
      primary:         '#E94B88',
      secondary:       '#9B5DE5',
      accent:          '#FFB703',
      background:      '#1A0A2E',
      backgroundLight: '#FAF8FC',
      surface:         '#FFFFFF',
      text:            '#2D1B69',
      textMuted:       '#6B5589',
    },
    shimmerAvailable: false,
    planRequired:     'starter',
  },
  fitness: {
    name:                 'fitness',
    label:                'Fitness',
    description:          'Forte e dinâmico para moda esportiva e athleisure',
    forSegments:          ['fitness', 'esportivo', 'athleisure'],
    defaultBackground:    'dark',
    allowLightBackground: false,
    allowDarkBackground:  true,
    fonts:                { display: 'Barlow Condensed', body: 'DM Sans', displayWeight: 700 },
    card: {
      aspectRatio:  '3/4',
      infoPosition: 'sidebar',
      borderRadius: '8px',
      shadow:       false,
    },
    defaultColors: {
      primary:         '#00FF87',
      secondary:       '#FF6B35',
      accent:          '#FFE500',
      background:      '#0A0F0A',
      backgroundLight: '#F0F5F0',
      surface:         '#111811',
      text:            '#E8FFE8',
      textMuted:       '#5A8A5A',
    },
    shimmerAvailable: false,
    planRequired:     'starter',
  },
  lumiere: {
    name:                 'lumiere',
    label:                'Lumière',
    description:          'Luxo e sofisticação para perfumaria e cosméticos',
    forSegments:          ['perfumaria', 'cosmeticos', 'beleza'],
    defaultBackground:    'dark',
    allowLightBackground: true,
    allowDarkBackground:  true,
    fonts:                { display: 'Cormorant', body: 'DM Sans', displayWeight: 300 },
    card: {
      aspectRatio:     '3/4',
      infoPosition:    'overlay',
      borderRadius:    '16px',
      shadow:          true,
      overlayGradient: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 50%)',
    },
    defaultColors: {
      primary:         '#C9A84C',
      secondary:       '#8B6914',
      accent:          '#E8D5A3',
      background:      '#0C0A08',
      backgroundLight: '#FAF8F5',
      surface:         '#1A1610',
      text:            '#F5EDD8',
      textMuted:       '#9B8B6A',
    },
    shimmerAvailable: true,
    planRequired:     'starter',
  },
}

export const THEME_NAMES = Object.keys(THEMES) as ThemeName[]

export function getTheme(name: string | null | undefined): ThemeDefinition {
  const key = (name ?? 'default') as ThemeName
  return THEMES[key] ?? THEMES.default
}

const PLAN_RANK: Record<PlanSlug, number> = {
  free:       0,
  starter:    1,
  pro:        2,
  loja:       3,
  enterprise: 4,
}

export function getAvailableThemes(plan: string): ThemeName[] {
  const rank = PLAN_RANK[plan as PlanSlug] ?? 0
  return THEME_NAMES.filter(name => rank >= PLAN_RANK[THEMES[name].planRequired])
}

export function canUseShimmer(plan: string): boolean {
  return ['pro', 'loja', 'enterprise'].includes(plan)
}

export function canSelectTheme(plan: string, themeName: ThemeName): boolean {
  return getAvailableThemes(plan).includes(themeName)
}

export function defaultShimmerForTheme(themeName: ThemeName): boolean {
  return themeName === 'lumiere'
}

export type StoreThemeConfig = {
  themeName:     ThemeName
  infoPosition:  CardInfoPosition
  aspectRatio:   string
  borderRadius:  string
  shadow:        boolean
  shimmer:       boolean
  overlayGradient?: string
}

export function themeToCardConfig(
  theme: ThemeDefinition,
  shimmer: boolean,
): StoreThemeConfig {
  return {
    themeName:        theme.name,
    infoPosition:     theme.card.infoPosition,
    aspectRatio:      theme.card.aspectRatio,
    borderRadius:     theme.card.borderRadius,
    shadow:           theme.card.shadow,
    shimmer,
    overlayGradient: theme.card.overlayGradient,
  }
}
