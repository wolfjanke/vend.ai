import type { ThemeDefaultPalette } from '@/lib/theme-page-bg'

type Props = {
  palette: Pick<ThemeDefaultPalette, 'primary' | 'accent' | 'pageBg'>
  size?: 'sm' | 'md'
  label?: string
}

const SIZE_CLASS = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
} as const

export default function ThemePaletteSwatches({ palette, size = 'sm', label }: Props) {
  const dot = SIZE_CLASS[size]
  const ariaLabel =
    label ??
    `Cores: primária ${palette.primary}, destaque ${palette.accent}, fundo ${palette.pageBg}`

  return (
    <div className="flex gap-1 shrink-0" role="img" aria-label={ariaLabel}>
      <span
        className={`${dot} rounded-full border border-white/20 shrink-0`}
        style={{ background: palette.primary }}
        aria-hidden
      />
      <span
        className={`${dot} rounded-full border border-white/20 shrink-0`}
        style={{ background: palette.accent }}
        aria-hidden
      />
      <span
        className={`${dot} rounded-full border border-white/20 shrink-0 ring-1 ring-inset ring-black/10`}
        style={{ background: palette.pageBg }}
        aria-hidden
      />
    </div>
  )
}
