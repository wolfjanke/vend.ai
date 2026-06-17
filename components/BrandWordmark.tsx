import { BRAND, BRAND_LOGO } from '@/lib/brand'

/** Altura em px do wordmark (largura proporcional ao viewBox 220×72). */
export const BRAND_WORDMARK_SIZE = {
  xs: 11,
  sm: 15,
  md: 22,
  lg: 30,
  xl: 42,
} as const

export type BrandWordmarkSize = keyof typeof BRAND_WORDMARK_SIZE

/** viewBox recortado do wordmark oficial (870×225). */
const ASPECT = 870 / 225

type Props = {
  size?: BrandWordmarkSize
  className?: string
}

/** Wordmark via SVG — nítido em qualquer DPI, fundo transparente. */
export default function BrandWordmark({ size = 'md', className = '' }: Props) {
  const height = BRAND_WORDMARK_SIZE[size]
  const width = Math.round(height * ASPECT)

  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG local; next/image não trata SVG estático aqui.
    <img
      src={BRAND_LOGO.wordmark}
      alt={BRAND.alt}
      width={width}
      height={height}
      className={`block shrink-0 object-contain object-left ${className}`.trim()}
      style={{ height, width: 'auto', maxWidth: width }}
      decoding="async"
    />
  )
}
