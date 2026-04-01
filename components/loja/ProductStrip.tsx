'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { CartItem, CustomCategory, ProductVariantDisplay } from '@/types'
import ProdutoCard from './ProdutoCard'

interface Props {
  sectionId:   string
  title:       string
  countLabel?: string
  displayItems: ProductVariantDisplay[]
  onAddToCart: (item: CartItem) => void
  onInteract?: () => void
  installmentsMaxNoInterest?: number | null
  customCategories?: CustomCategory[]
}

/** Faixa horizontal: ~2 cartões visíveis + "peek" do próximo (scroll lateral). */
export default function ProductStrip({
  sectionId,
  title,
  countLabel,
  displayItems,
  onAddToCart,
  onInteract,
  installmentsMaxNoInterest = null,
  customCategories = [],
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeDot, setActiveDot] = useState(0)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el || displayItems.length === 0) return

    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)

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
    updateScrollState()
    el.addEventListener('scroll', updateScrollState, { passive: true })
    const ro = new ResizeObserver(() => updateScrollState())
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', updateScrollState)
      ro.disconnect()
    }
  }, [updateScrollState, displayItems])

  const scrollBy = useCallback((direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const amount = el.clientWidth * 0.8
    el.scrollBy({ left: direction === 'right' ? amount : -amount, behavior: 'smooth' })
  }, [])

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

      {/* Wrapper relativo para posicionar as setas sobre o carrossel */}
      <div className="relative min-w-0">
        {canScrollLeft && (
          <button
            onClick={() => scrollBy('left')}
            aria-label="Rolar para esquerda"
            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-foreground/10 text-foreground shadow-md transition-opacity duration-200 touch-manipulation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {canScrollRight && (
          <button
            onClick={() => scrollBy('right')}
            aria-label="Rolar para direita"
            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-foreground/10 text-foreground shadow-md transition-opacity duration-200 touch-manipulation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}

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
                'shrink-0 snap-start h-full flex flex-col',
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
                customCategories={customCategories}
              />
            </div>
          ))}
        </div>
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
