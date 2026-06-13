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

/** Classes Tailwind para a logo no header (mobile-first). */
export function logoHeaderClassName(size: LogoSize): string {
  switch (size) {
    case 'sm':
      return 'h-10 w-auto max-w-[100px] min-h-[2.5rem] shrink-0 rounded-lg object-contain'
    case 'lg':
      return 'h-14 sm:h-16 w-auto max-w-[200px] sm:max-w-[240px] min-h-[3.5rem] sm:min-h-[4rem] shrink-0 rounded-lg object-contain'
    default:
      return 'h-12 w-auto max-w-[152px] min-h-[3rem] shrink-0 rounded-lg object-contain'
  }
}

/** Altura do header conforme o tamanho da logo (G precisa de mais respiro). */
export function logoHeaderShellClassName(size: LogoSize): string {
  return size === 'lg'
    ? 'min-h-[4.5rem] h-auto py-2'
    : 'h-16'
}

/** Fallback de iniciais quando não há logo. */
export function logoFallbackClassName(size: LogoSize): string {
  switch (size) {
    case 'sm':
      return 'w-10 h-10 min-h-[2.5rem] min-w-[2.5rem] shrink-0 rounded-[10px] flex items-center justify-center text-xs font-bold text-white'
    case 'lg':
      return 'w-14 h-14 sm:w-16 sm:h-16 min-h-[3.5rem] min-w-[3.5rem] sm:min-h-[4rem] sm:min-w-[4rem] shrink-0 rounded-[12px] flex items-center justify-center text-base font-bold text-white'
    default:
      return 'w-12 h-12 min-h-[3rem] min-w-[3rem] shrink-0 rounded-[10px] flex items-center justify-center text-sm font-bold text-white'
  }
}

export function resolveStoreLogoUrl(
  logoUrl: string | null | undefined,
  themeLogoUrl: string | null | undefined,
): string | null {
  return logoUrl?.trim() || themeLogoUrl?.trim() || null
}
