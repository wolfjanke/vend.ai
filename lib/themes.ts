import type { PlanSlug } from '@/lib/plans'

export type ThemeName =
  | 'default'
  | 'boutique'
  | 'street'
  | 'editorial'
  | 'pop'
  | 'fitness'
  | 'lumiere'
  | 'flash'
  | 'casual'
  | 'social'

export type ThemeBackground = 'light' | 'dark'

export type CardInfoPosition = 'below' | 'overlay' | 'hover' | 'badge' | 'sidebar'

export type CatalogLayout = 'strip' | 'grid' | 'grid-dense' | 'grid-feed' | 'list'

export type CardHover = 'lift' | 'none' | 'shadow'

export type ShadowStyle = 'none' | 'light' | 'medium' | 'heavy' | 'glow'

export type CategoryNavDefault = 'pills' | 'circles' | 'cards'

export type CardAspectRatio = '3/4' | '1/1' | '4/5' | '9/16'

export interface ThemeSpacing {
  cardGap:      string
  sectionGap:   string
  pagePadding:  string
}

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
    aspectRatio:      CardAspectRatio
    infoPosition:     CardInfoPosition
    borderRadius:     string
    shadow:           boolean
    overlayGradient?: string
  }
  catalogLayout:        CatalogLayout
  spacing:              ThemeSpacing
  buttonRadius:         string
  cardHover:            CardHover
  categoryNavDefault:   CategoryNavDefault
  shadowStyle:          ShadowStyle
  catalogColsMobile:    number
  catalogColsDesktop:   number
  showColorSwatches:    boolean
  showFavoriteIcon:     boolean
  showDiscountBadge:    boolean
  headerLetterSpacing?: string
  accentGradient?:      string
  priceColor?:          string
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

const DEFAULT_SPACING: ThemeSpacing = {
  cardGap:     '8px',
  sectionGap:  '32px',
  pagePadding: '16px',
}

export const THEMES: Record<ThemeName, ThemeDefinition> = {
  default: {
    name:                 'default',
    label: 'vendai.club',
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
    catalogLayout:      'strip',
    spacing:            DEFAULT_SPACING,
    buttonRadius:       '12px',
    cardHover:          'lift',
    categoryNavDefault: 'pills',
    shadowStyle:        'none',
    catalogColsMobile:  2,
    catalogColsDesktop: 3,
    showColorSwatches:  false,
    showFavoriteIcon:   false,
    showDiscountBadge:  false,
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
  editorial: {
    name:                 'editorial',
    label:                'Editorial',
    description:          'Luxo silencioso — preto e branco, fotografia em destaque',
    forSegments:          ['moda_premium', 'moda_feminina', 'moda_adulta'],
    defaultBackground:    'light',
    allowLightBackground: true,
    allowDarkBackground:  true,
    fonts:                { display: 'Cormorant Garamond', body: 'Inter', displayWeight: 300 },
    card: {
      aspectRatio:  '4/5',
      infoPosition: 'hover',
      borderRadius: '0px',
      shadow:       false,
    },
    catalogLayout:      'grid',
    spacing:            { cardGap: '16px', sectionGap: '40px', pagePadding: '20px' },
    buttonRadius:       '0px',
    cardHover:          'none',
    categoryNavDefault: 'pills',
    shadowStyle:        'none',
    catalogColsMobile:  2,
    catalogColsDesktop: 3,
    showColorSwatches:  false,
    showFavoriteIcon:   false,
    showDiscountBadge:  false,
    defaultColors: {
      primary:         '#000000',
      secondary:       '#333333',
      accent:          '#000000',
      background:      '#111111',
      backgroundLight: '#FFFFFF',
      surface:         '#F5F5F5',
      text:            '#000000',
      textMuted:       '#666666',
    },
    shimmerAvailable: false,
    planRequired:     'starter',
  },
  pop: {
    name:                 'pop',
    label:                'Discovery',
    description:          'Jovem e acessível — foco em descoberta e variedade',
    forSegments:          ['moda_jovem', 'moda_infantil', 'moda_unisex'],
    defaultBackground:    'light',
    allowLightBackground: true,
    allowDarkBackground:  false,
    fonts:                { display: 'DM Sans', body: 'DM Sans', displayWeight: 700 },
    card: {
      aspectRatio:  '3/4',
      infoPosition: 'below',
      borderRadius: '8px',
      shadow:       true,
    },
    catalogLayout:      'grid',
    spacing:            { cardGap: '8px', sectionGap: '24px', pagePadding: '16px' },
    buttonRadius:       '24px',
    cardHover:          'shadow',
    categoryNavDefault: 'pills',
    shadowStyle:        'light',
    catalogColsMobile:  2,
    catalogColsDesktop: 4,
    showColorSwatches:  false,
    showFavoriteIcon:   false,
    showDiscountBadge:  false,
    defaultColors: {
      primary:         '#FF3C5F',
      secondary:       '#2D2D2D',
      accent:          '#FF3C5F',
      background:      '#1A1A1A',
      backgroundLight: '#FFFFFF',
      surface:         '#FFFFFF',
      text:            '#1A1A1A',
      textMuted:       '#666666',
    },
    shimmerAvailable: false,
    planRequired:     'starter',
  },
  flash: {
    name:                 'flash',
    label:                'Flash',
    description:          'Alta energia — promoções em destaque, grid denso',
    forSegments:          ['moda_jovem', 'moda_unisex', 'fast_fashion'],
    defaultBackground:    'light',
    allowLightBackground: true,
    allowDarkBackground:  false,
    fonts:                { display: 'Barlow', body: 'Barlow', displayWeight: 700 },
    card: {
      aspectRatio:  '1/1',
      infoPosition: 'badge',
      borderRadius: '4px',
      shadow:       false,
    },
    catalogLayout:      'grid-dense',
    spacing:            { cardGap: '5px', sectionGap: '20px', pagePadding: '12px' },
    buttonRadius:       '4px',
    cardHover:          'none',
    categoryNavDefault: 'pills',
    shadowStyle:        'none',
    catalogColsMobile:  2,
    catalogColsDesktop: 5,
    showColorSwatches:  false,
    showFavoriteIcon:   false,
    showDiscountBadge:  true,
    defaultColors: {
      primary:         '#E31837',
      secondary:       '#222222',
      accent:          '#FF6600',
      background:      '#111111',
      backgroundLight: '#FFFFFF',
      surface:         '#FFFFFF',
      text:            '#222222',
      textMuted:       '#888888',
    },
    shimmerAvailable: false,
    planRequired:     'starter',
  },
  boutique: {
    name:                 'boutique',
    label:                'Luxe',
    description:          'Luxo aspiracional — revista de moda com muito respiro',
    forSegments:          ['moda_premium', 'moda_feminina', 'moda_adulta'],
    defaultBackground:    'light',
    allowLightBackground: true,
    allowDarkBackground:  true,
    fonts:                { display: 'Playfair Display', body: 'Libre Baskerville', displayWeight: 400 },
    card: {
      aspectRatio:  '4/5',
      infoPosition: 'hover',
      borderRadius: '2px',
      shadow:       false,
    },
    catalogLayout:      'grid',
    spacing:            { cardGap: '24px', sectionGap: '48px', pagePadding: '24px' },
    buttonRadius:       '0px',
    cardHover:          'none',
    categoryNavDefault: 'pills',
    shadowStyle:        'none',
    catalogColsMobile:  2,
    catalogColsDesktop: 3,
    showColorSwatches:  false,
    showFavoriteIcon:   false,
    showDiscountBadge:  false,
    defaultColors: {
      primary:         '#1A1A1A',
      secondary:       '#8B7355',
      accent:          '#8B7355',
      background:      '#111111',
      backgroundLight: '#FAFAFA',
      surface:         '#FFFFFF',
      text:            '#1A1A1A',
      textMuted:       '#888888',
    },
    shimmerAvailable: false,
    planRequired:     'starter',
  },
  casual: {
    name:                 'casual',
    label:                'Casual',
    description:          'Democrático e acessível — cores disponíveis no card',
    forSegments:          ['moda_unisex', 'moda_jovem', 'moda_adulta'],
    defaultBackground:    'light',
    allowLightBackground: true,
    allowDarkBackground:  false,
    fonts:                { display: 'Outfit', body: 'Outfit', displayWeight: 500 },
    card: {
      aspectRatio:  '3/4',
      infoPosition: 'below',
      borderRadius: '6px',
      shadow:       true,
    },
    catalogLayout:      'grid',
    spacing:            { cardGap: '12px', sectionGap: '32px', pagePadding: '16px' },
    buttonRadius:       '6px',
    cardHover:          'shadow',
    categoryNavDefault: 'circles',
    shadowStyle:        'light',
    catalogColsMobile:  2,
    catalogColsDesktop: 4,
    showColorSwatches:  true,
    showFavoriteIcon:   false,
    showDiscountBadge:  false,
    defaultColors: {
      primary:         '#E50010',
      secondary:       '#222222',
      accent:          '#E50010',
      background:      '#111111',
      backgroundLight: '#FFFFFF',
      surface:         '#F5F5F5',
      text:            '#222222',
      textMuted:       '#666666',
    },
    shimmerAvailable: false,
    planRequired:     'starter',
  },
  lumiere: {
    name:                 'lumiere',
    label:                'Boutique',
    description:          'Boutique sofisticada — dourado acetinado e sombras suaves',
    forSegments:          ['moda_premium', 'perfumaria', 'cosmeticos', 'beleza'],
    defaultBackground:    'light',
    allowLightBackground: true,
    allowDarkBackground:  true,
    fonts:                { display: 'Lora', body: 'Jost', displayWeight: 600 },
    card: {
      aspectRatio:  '3/4',
      infoPosition: 'below',
      borderRadius: '12px',
      shadow:       true,
    },
    catalogLayout:      'grid',
    spacing:            { cardGap: '16px', sectionGap: '36px', pagePadding: '16px' },
    buttonRadius:       '8px',
    cardHover:          'lift',
    categoryNavDefault: 'pills',
    shadowStyle:        'medium',
    catalogColsMobile:  2,
    catalogColsDesktop: 3,
    showColorSwatches:  false,
    showFavoriteIcon:   false,
    showDiscountBadge:  false,
    defaultColors: {
      primary:         '#C9A96E',
      secondary:       '#2C2C2C',
      accent:          '#C9A96E',
      background:      '#0C0A08',
      backgroundLight: '#FAF9F7',
      surface:         '#FFFFFF',
      text:            '#2C2C2C',
      textMuted:       '#888888',
    },
    shimmerAvailable: true,
    planRequired:     'starter',
  },
  fitness: {
    name:                 'fitness',
    label:                'Marketplace',
    description:          'Confiável e informativo — preço, frete e parcelamento em destaque',
    forSegments:          ['marketplace', 'volume', 'variedade'],
    defaultBackground:    'light',
    allowLightBackground: true,
    allowDarkBackground:  false,
    fonts:                { display: 'Inter', body: 'Inter', displayWeight: 700 },
    card: {
      aspectRatio:  '1/1',
      infoPosition: 'sidebar',
      borderRadius: '8px',
      shadow:       true,
    },
    catalogLayout:      'list',
    spacing:            { cardGap: '8px', sectionGap: '24px', pagePadding: '16px' },
    buttonRadius:       '6px',
    cardHover:          'shadow',
    categoryNavDefault: 'pills',
    shadowStyle:        'heavy',
    catalogColsMobile:  1,
    catalogColsDesktop: 3,
    showColorSwatches:  false,
    showFavoriteIcon:   false,
    showDiscountBadge:  false,
    priceColor:         '#00A650',
    defaultColors: {
      primary:         '#3483FA',
      secondary:       '#333333',
      accent:          '#3483FA',
      background:      '#111111',
      backgroundLight: '#EEEEEE',
      surface:         '#FFFFFF',
      text:            '#333333',
      textMuted:       '#666666',
    },
    shimmerAvailable: false,
    planRequired:     'starter',
  },
  social: {
    name:                 'social',
    label:                'Social',
    description:          'Visual de rede social — feed imersivo estilo Instagram',
    forSegments:          ['influencer', 'moda_jovem', 'instagram'],
    defaultBackground:    'light',
    allowLightBackground: true,
    allowDarkBackground:  false,
    fonts:                { display: 'Nunito', body: 'Nunito', displayWeight: 800 },
    card: {
      aspectRatio:     '1/1',
      infoPosition:    'overlay',
      borderRadius:    '0px',
      shadow:          false,
      overlayGradient: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 50%)',
    },
    catalogLayout:      'grid-feed',
    spacing:            { cardGap: '2px', sectionGap: '16px', pagePadding: '0px' },
    buttonRadius:       '20px',
    cardHover:          'none',
    categoryNavDefault: 'pills',
    shadowStyle:        'none',
    catalogColsMobile:  3,
    catalogColsDesktop: 2,
    showColorSwatches:  false,
    showFavoriteIcon:   true,
    showDiscountBadge:  false,
    accentGradient:     'linear-gradient(135deg, #F77737 0%, #E1306C 50%, #833AB4 100%)',
    defaultColors: {
      primary:         '#E1306C',
      secondary:       '#262626',
      accent:          '#833AB4',
      background:      '#111111',
      backgroundLight: '#FFFFFF',
      surface:         '#FAFAFA',
      text:            '#262626',
      textMuted:       '#8E8E8E',
    },
    shimmerAvailable: false,
    planRequired:     'starter',
  },
  street: {
    name:                 'street',
    label:                'Viral',
    description:          'Ultra jovem Gen Z — produto como mídia, formato stories',
    forSegments:          ['streetwear', 'moda_jovem', 'gen_z'],
    defaultBackground:    'dark',
    allowLightBackground: false,
    allowDarkBackground:  true,
    fonts:                { display: 'Bebas Neue', body: 'DM Sans', displayWeight: 400 },
    card: {
      aspectRatio:     '9/16',
      infoPosition:    'overlay',
      borderRadius:    '12px',
      shadow:          false,
      overlayGradient: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, transparent 55%)',
    },
    catalogLayout:      'strip',
    spacing:            { cardGap: '6px', sectionGap: '24px', pagePadding: '12px' },
    buttonRadius:       '4px',
    cardHover:          'none',
    categoryNavDefault: 'pills',
    shadowStyle:        'glow',
    catalogColsMobile:  2,
    catalogColsDesktop: 3,
    showColorSwatches:  false,
    showFavoriteIcon:   true,
    showDiscountBadge:  false,
    headerLetterSpacing: '0.08em',
    defaultColors: {
      primary:         '#FE2C55',
      secondary:       '#25F4EE',
      accent:          '#FE2C55',
      background:      '#0A0A0A',
      backgroundLight: '#F0F0F0',
      surface:         '#1A1A1A',
      text:            '#FFFFFF',
      textMuted:       '#888888',
    },
    shimmerAvailable: false,
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
  themeName:           ThemeName
  infoPosition:        CardInfoPosition
  aspectRatio:         string
  borderRadius:        string
  shadow:              boolean
  shimmer:             boolean
  overlayGradient?:    string
  catalogLayout:       CatalogLayout
  cardGap:             string
  sectionGap:          string
  buttonRadius:        string
  cardHover:           CardHover
  catalogColsMobile:   number
  catalogColsDesktop:  number
  showColorSwatches:   boolean
  showFavoriteIcon:    boolean
  showDiscountBadge:   boolean
}

export function themeToCardConfig(
  theme: ThemeDefinition,
  shimmer: boolean,
): StoreThemeConfig {
  return {
    themeName:          theme.name,
    infoPosition:       theme.card.infoPosition,
    aspectRatio:        theme.card.aspectRatio,
    borderRadius:       theme.card.borderRadius,
    shadow:             theme.card.shadow,
    shimmer,
    overlayGradient:    theme.card.overlayGradient,
    catalogLayout:      theme.catalogLayout,
    cardGap:            theme.spacing.cardGap,
    sectionGap:         theme.spacing.sectionGap,
    buttonRadius:       theme.buttonRadius,
    cardHover:          theme.cardHover,
    catalogColsMobile:  theme.catalogColsMobile,
    catalogColsDesktop: theme.catalogColsDesktop,
    showColorSwatches:  theme.showColorSwatches,
    showFavoriteIcon:   theme.showFavoriteIcon,
    showDiscountBadge:  theme.showDiscountBadge,
  }
}
