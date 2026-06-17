'use client'

import { useEffect, useRef, useState } from 'react'
import LojaBrand from './LojaBrand'
import LojaHeaderActions from './LojaHeaderActions'
import type { LogoSize } from '@/lib/store-logo'
import { logoHeaderShellClassName } from '@/lib/store-logo'
import type { BrandDisplay, HeaderLayout, LogoShape } from '@/lib/vitrine-layout'

type Props = {
  slug:         string
  storeName:    string
  whatsapp:     string
  logoUrl:      string | null
  logoSize?:    LogoSize
  logoShape?:   LogoShape
  brandDisplay: BrandDisplay
  headerLayout: HeaderLayout
  tagline?:     string | null
  cartQty:      number
  onOpenCart:   () => void
}

export default function LojaHeader({
  slug,
  storeName,
  whatsapp,
  logoUrl,
  logoSize = 'md',
  logoShape = 'rect',
  brandDisplay,
  headerLayout,
  tagline,
  cartQty,
  onOpenCart,
}: Props) {
  const heroRef = useRef<HTMLDivElement>(null)
  const [compactVisible, setCompactVisible] = useState(false)
  const isCentered = headerLayout === 'centered'

  useEffect(() => {
    if (!isCentered) {
      setCompactVisible(false)
      return
    }

    const hero = heroRef.current
    if (!hero) return

    const observer = new IntersectionObserver(
      ([entry]) => setCompactVisible(!entry.isIntersecting),
      { root: null, threshold: 0, rootMargin: '-1px 0px 0px 0px' },
    )
    observer.observe(hero)
    return () => observer.disconnect()
  }, [isCentered])

  if (!isCentered) {
    return (
      <header
        className={`loja-header sticky top-0 z-50 px-4 md:px-6 animate-slide-down ${logoHeaderShellClassName(logoSize ?? 'md')}`}
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="mx-auto flex h-full w-full max-w-5xl items-center justify-between gap-3 min-w-0">
          <LojaBrand
            slug={slug}
            storeName={storeName}
            logoUrl={logoUrl}
            logoSize={logoSize}
            logoShape={logoShape}
            brandDisplay={brandDisplay}
            tagline={tagline}
            variant="bar"
            className="flex-1"
          />
          <LojaHeaderActions whatsapp={whatsapp} cartQty={cartQty} onOpenCart={onOpenCart} />
        </div>
      </header>
    )
  }

  return (
    <>
      <div
        ref={heroRef}
        className="loja-header-hero relative px-4 md:px-6 pt-3 pb-6 md:pb-8 animate-fade-up"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-end gap-2 px-4 md:px-6 pt-3 z-10 max-w-5xl mx-auto w-full pointer-events-none"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
        >
          <div className="pointer-events-auto">
            <LojaHeaderActions whatsapp={whatsapp} cartQty={cartQty} onOpenCart={onOpenCart} compact />
          </div>
        </div>

        <div className="mx-auto w-full max-w-5xl pt-12 md:pt-14">
          <LojaBrand
            slug={slug}
            storeName={storeName}
            logoUrl={logoUrl}
            logoSize={logoSize}
            logoShape={logoShape}
            brandDisplay={brandDisplay}
            tagline={tagline}
            variant="hero"
          />
        </div>
      </div>

      <header
        className={[
          'loja-header sticky top-0 z-50 px-4 md:px-6 border-b transition-all duration-300',
          compactVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none',
        ].join(' ')}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
        aria-hidden={!compactVisible}
      >
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-3 min-w-0">
          <LojaBrand
            slug={slug}
            storeName={storeName}
            logoUrl={logoUrl}
            logoSize="sm"
            logoShape={logoShape}
            brandDisplay={brandDisplay === 'logo-only' ? 'logo-only' : 'logo-and-name'}
            tagline={null}
            variant="bar"
            className="flex-1 min-w-0"
            includeHeading={false}
          />
          <LojaHeaderActions whatsapp={whatsapp} cartQty={cartQty} onOpenCart={onOpenCart} compact />
        </div>
      </header>
    </>
  )
}
