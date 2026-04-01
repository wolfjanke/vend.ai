'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { CartItem, ProductVariantDisplay } from '@/types'
import ProdutoCard from './ProdutoCard'

interface Props {
  sectionId:   string
  title:       string
  countLabel?: string
  displayItems: ProductVariantDisplay[]
  onAddToCart: (item: CartItem) => void
  onInteract?: () => void
  installmentsMaxNoInterest?: number | null
}

/** Faixa horizontal: ~2 cartões visíveis + “peek” do próximo (scroll lateral). */
export default function ProductStrip({
  sectionId,
  title,
  countLabel,
  displayItems,
  onAddToCart,
  onInteract,
  installmentsMaxNoInterest = null,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeDot, setActiveDot] = useState(0)

  const updateDotFromScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el || displayItems.length === 0) return
    const first = el.querySelector<HTMLElement>('[data-strip-card]')
    if (!first) return
    const step = first.offsetWidth + 8
    if (step <= 0) return
    const idx = Math.round(el.scrollLeft / step)
    setActiveDot(Math.min(Math.max(0, idx), displayItems.length - 1))
  }, [displayItems.length])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateDotFromScroll()
    el.addEventListener('scroll', updateDotFromScroll, { passive: true })
    const ro = new ResizeObserver(() => updateDotFromScroll())
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', updateDotFromScroll)
      ro.disconnect()
    }
  }, [updateDotFromScroll, displayItems])

  if (displayItems.length === 0) return null

  const headingId = `catalog-strip-${sectionId}`

  return (
    <section className="mb-8 md:mb-10 min-w-0" aria-labelledby={headingId}>
      <div className="flex items-baseline justify-between gap-2 px-4 md:px-6 mb-3 min-w-0">
        <h2 id={headingId} className="font-syne font-bold text-base sm:text-lg md:text-xl truncate min-w-0">
          {title}
        </h2>
        {countLabel != null && (
          <span className="text-xs sm:text-sm text-muted shrink-0 tabular-nums">{countLabel}</span>
        )}
      </div>
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto overflow-y-hidden pb-2 px-4 md:px-6 scrollbar-hide snap-x snap-mandatory scroll-pl-4 scroll-pr-4 touch-pan-x"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {displayItems.map(({ product, variantIndex }) => (
          <div
            key={`${product.id}-${variantIndex}`}
            data-strip-card
            className={[
              'shrink-0 snap-start',
              'w-[clamp(148px,calc((100vw-2.5rem)/2.35),200px)]',
              'sm:w-[clamp(152px,calc((100vw-2.75rem)/2.35),210px)]',
              'md:w-[clamp(168px,calc((100vw-3.5rem)/2.35),220px)]',
            ].join(' ')}
          >
            <ProdutoCard
              product={product}
              displayVariantIndex={variantIndex}
              onAddToCart={onAddToCart}
              onInteract={onInteract}
              layout="vitrine"
              installmentsMaxNoInterest={installmentsMaxNoInterest}
            />
          </div>
        ))}
      </div>
      {displayItems.length > 1 && (
        <div
          className="flex justify-center gap-1.5 px-4 mt-1 min-h-[8px]"
          role="tablist"
          aria-label={`Posição no carrossel: ${sectionId}`}
        >
          {displayItems.map(({ product, variantIndex }, i) => (
            <span
              key={`${product.id}-${variantIndex}-${i}`}
              role="presentation"
              className={`h-1.5 rounded-full transition-colors ${
                i === activeDot ? 'w-4 bg-foreground/80' : 'w-1.5 bg-foreground/25'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
