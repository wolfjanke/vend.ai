'use client'

import { getStoreInitials } from '@/lib/store-brand'
import {
  logoFallbackClassName,
  logoHeaderClassName,
  logoHeroClassName,
  logoHeroFallbackClassName,
  normalizeLogoSize,
  type LogoSize,
} from '@/lib/store-logo'
import { vitrineText } from '@/lib/strip-emoji'
import type { BrandDisplay, LogoShape } from '@/lib/vitrine-layout'

type Props = {
  slug:         string
  storeName:    string
  logoUrl:      string | null
  logoSize?:    LogoSize
  logoShape?:   LogoShape
  brandDisplay: BrandDisplay
  tagline?:     string | null
  variant?:     'bar' | 'hero'
  className?:   string
  /** Evita h1 duplicado no header compacto ao rolar. */
  includeHeading?: boolean
}

export default function LojaBrand({
  slug,
  storeName,
  logoUrl,
  logoSize = 'md',
  logoShape = 'rect',
  brandDisplay,
  tagline,
  variant = 'bar',
  className = '',
  includeHeading = true,
}: Props) {
  const size = normalizeLogoSize(logoSize)
  const displayName = vitrineText(storeName)
  const displayTagline = tagline?.trim() ? vitrineText(tagline) : null
  const isHero = variant === 'hero'

  const showLogo = brandDisplay !== 'name-only'
  const showName = brandDisplay !== 'logo-only'
  const showTagline = Boolean(displayTagline) && (isHero || brandDisplay !== 'logo-only')

  const logoClass = isHero ? logoHeroClassName(size, logoShape) : logoHeaderClassName(size, logoShape)
  const fallbackClass = isHero
    ? logoHeroFallbackClassName(size, logoShape)
    : logoFallbackClassName(size, logoShape)

  const nameClass = isHero
    ? 'loja-brand-name block text-xl sm:text-2xl text-center break-words'
    : 'loja-brand-name block text-lg sm:text-xl truncate'

  const layoutClass = isHero
    ? 'flex flex-col items-center text-center gap-3 min-w-0 w-full'
    : 'flex items-center gap-3 min-w-0 min-h-[44px]'

  const NameTag = includeHeading ? 'h1' : 'span'

  return (
    <a href={`/${slug}`} className={`${layoutClass} ${className}`.trim()}>
      {showLogo && (
        logoUrl ? (
          <img
            src={logoUrl}
            alt={storeName}
            className={logoClass}
          />
        ) : (
          <div
            className={fallbackClass}
            style={{ background: 'var(--theme-vi-avatar)' }}
            aria-hidden
          >
            {getStoreInitials(storeName)}
          </div>
        )
      )}

      {(showName || showTagline) && (
        <div className={isHero ? 'min-w-0 max-w-full px-2' : 'min-w-0'}>
          {showName && (
            <NameTag className={nameClass}>
              {displayName}
            </NameTag>
          )}
          {showTagline && (
            <span
              className={[
                'block text-muted break-words',
                isHero ? 'text-xs sm:text-sm mt-1 max-w-[min(320px,90vw)]' : 'text-[11px] truncate max-w-[200px] sm:max-w-none',
              ].join(' ')}
            >
              {displayTagline}
            </span>
          )}
        </div>
      )}

      {brandDisplay === 'logo-only' && !showName && includeHeading && (
        <h1 className="sr-only">{displayName}</h1>
      )}
    </a>
  )
}
