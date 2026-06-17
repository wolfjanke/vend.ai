import Link from 'next/link'
import { BRAND } from '@/lib/brand'
import BrandWordmark, { type BrandWordmarkSize } from '@/components/BrandWordmark'

type Props = {
  size?:      BrandWordmarkSize
  href?:      string | null
  className?: string
  priority?:  boolean
}

export default function BrandLogo({
  size = 'md',
  href = '/',
  className = '',
}: Props) {
  const content = <BrandWordmark size={size} className={className} />

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center min-h-[44px] shrink-0" aria-label={BRAND.alt}>
        {content}
      </Link>
    )
  }

  return <span className="inline-flex items-center shrink-0">{content}</span>
}

export { BrandWordmark }
