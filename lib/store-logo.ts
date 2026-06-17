import type { LogoShape } from '@/lib/vitrine-layout'

/** Tamanho da logo no header da vitrine (P / M / G no admin). */
export type LogoSize = 'sm' | 'md' | 'lg'

export const LOGO_SIZE_OPTIONS: Array<{ value: LogoSize; label: string; hint: string }> = [
  { value: 'sm', label: 'P', hint: 'Compacta' },
  { value: 'md', label: 'M', hint: 'Padrão' },
  { value: 'lg', label: 'G', hint: 'Destaque' },
]

export function normalizeLogoSize(raw: unknown): LogoSize {
  if (raw === 'sm' || raw === 'md' || raw === 'lg') return raw
  return 'md'
}

function logoRectSizeClasses(size: LogoSize): string {
  switch (size) {
    case 'sm':
      return 'h-10 w-auto max-w-[100px] min-h-[2.5rem]'
    case 'lg':
      return 'h-14 sm:h-16 w-auto max-w-[200px] sm:max-w-[240px] min-h-[3.5rem] sm:min-h-[4rem]'
    default:
      return 'h-12 w-auto max-w-[152px] min-h-[3rem]'
  }
}

function logoSquareSizeClasses(size: LogoSize): string {
  switch (size) {
    case 'sm':
      return 'h-10 w-10 min-h-[2.5rem] min-w-[2.5rem]'
    case 'lg':
      return 'h-16 w-16 sm:h-20 sm:w-20 min-h-[4rem] min-w-[4rem] sm:min-h-[5rem] sm:min-w-[5rem]'
    default:
      return 'h-12 w-12 min-h-[3rem] min-w-[3rem]'
  }
}

/** Classes Tailwind para a logo no header (mobile-first). */
export function logoHeaderClassName(size: LogoSize, shape: LogoShape = 'rect'): string {
  const shrink = 'shrink-0'
  if (shape === 'circle') {
    return `${logoSquareSizeClasses(size)} ${shrink} rounded-full object-cover aspect-square`
  }
  if (shape === 'square') {
    return `${logoSquareSizeClasses(size)} ${shrink} rounded-xl object-contain aspect-square`
  }
  return `${logoRectSizeClasses(size)} ${shrink} rounded-lg object-contain`
}

/** Logo maior no bloco hero centralizado. */
export function logoHeroClassName(size: LogoSize, shape: LogoShape = 'rect'): string {
  const heroScale: LogoSize = size === 'sm' ? 'md' : size === 'md' ? 'lg' : 'lg'
  if (shape === 'circle') {
    return 'h-20 w-20 sm:h-24 sm:w-24 min-h-[5rem] min-w-[5rem] shrink-0 rounded-full object-cover aspect-square'
  }
  if (shape === 'square') {
    return 'h-20 w-20 sm:h-24 sm:w-24 min-h-[5rem] min-w-[5rem] shrink-0 rounded-2xl object-contain aspect-square'
  }
  return `${logoRectSizeClasses(heroScale)} max-w-[min(280px,80vw)] shrink-0 rounded-xl object-contain`
}

/** Altura do header conforme o tamanho da logo (G precisa de mais respiro). */
export function logoHeaderShellClassName(size: LogoSize): string {
  return size === 'lg'
    ? 'min-h-[4.5rem] h-auto py-2'
    : 'h-16'
}

/** Fallback de iniciais quando não há logo. */
export function logoFallbackClassName(size: LogoSize, shape: LogoShape = 'rect'): string {
  const rounded =
    shape === 'circle' ? 'rounded-full' : shape === 'square' ? 'rounded-xl' : 'rounded-[10px]'
  switch (size) {
    case 'sm':
      return `w-10 h-10 min-h-[2.5rem] min-w-[2.5rem] shrink-0 ${rounded} flex items-center justify-center text-xs font-bold text-white`
    case 'lg':
      return `w-14 h-14 sm:w-16 sm:h-16 min-h-[3.5rem] min-w-[3.5rem] sm:min-h-[4rem] sm:min-w-[4rem] shrink-0 ${rounded} flex items-center justify-center text-base font-bold text-white`
    default:
      return `w-12 h-12 min-h-[3rem] min-w-[3rem] shrink-0 ${rounded} flex items-center justify-center text-sm font-bold text-white`
  }
}

export function logoHeroFallbackClassName(size: LogoSize, shape: LogoShape = 'rect'): string {
  const rounded =
    shape === 'circle' ? 'rounded-full' : shape === 'square' ? 'rounded-2xl' : 'rounded-xl'
  const dim =
    size === 'sm'
      ? 'w-16 h-16 text-sm'
      : 'w-20 h-20 sm:w-24 sm:h-24 text-base sm:text-lg'
  return `${dim} min-h-[4rem] min-w-[4rem] shrink-0 ${rounded} flex items-center justify-center font-bold text-white`
}

export function resolveStoreLogoUrl(
  logoUrl: string | null | undefined,
  themeLogoUrl: string | null | undefined,
): string | null {
  return logoUrl?.trim() || themeLogoUrl?.trim() || null
}
