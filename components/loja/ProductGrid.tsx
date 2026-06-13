'use client'

import type { CartItem, CustomCategory, ProductVariantDisplay } from '@/types'
import type { StoreThemeConfig } from '@/lib/themes'
import ProdutoCard from './ProdutoCard'
import { useLoja } from './LojaContext'

interface Props {
  sectionId:   string
  title:       string
  countLabel?: string
  displayItems: ProductVariantDisplay[]
  cardTheme:   StoreThemeConfig
  onAddToCart: (item: CartItem) => void
  onInteract?: () => void
  onProductFocus?: (product: import('@/types').Product) => void
  installmentsMaxNoInterest?: number | null
  customCategories?: CustomCategory[]
}

function gridClassForLayout(layout: StoreThemeConfig['catalogLayout']): string {
  switch (layout) {
    case 'grid-dense':
      return 'catalog-grid catalog-grid-dense'
    case 'grid-feed':
      return 'catalog-grid catalog-grid-feed'
    case 'list':
      return 'catalog-grid catalog-grid-list'
    default:
      return 'catalog-grid'
  }
}

export default function ProductGrid({
  sectionId,
  title,
  countLabel,
  displayItems,
  onAddToCart,
  onInteract,
  onProductFocus,
  cardTheme,
  installmentsMaxNoInterest = null,
  customCategories = [],
}: Props) {
  const { store } = useLoja()

  if (displayItems.length === 0) return null

  const headingId = `catalog-grid-${sectionId}`
  const isFeed = cardTheme.catalogLayout === 'grid-feed'
  const isList = cardTheme.catalogLayout === 'list'

  return (
    <section
      className="min-w-0"
      style={{ marginBottom: 'var(--theme-section-gap)' }}
      aria-labelledby={headingId}
    >
      {!isFeed && (
        <div className="flex items-baseline justify-between gap-2 px-4 md:px-6 mb-3 min-w-0">
          <h2 id={headingId} className="catalog-section-title font-syne font-bold truncate min-w-0">
            {title}
          </h2>
          {countLabel != null && (
            <span className="text-xs sm:text-sm text-muted shrink-0 tabular-nums">{countLabel}</span>
          )}
        </div>
      )}

      {isFeed && (
        <div className="flex items-baseline justify-between gap-2 px-3 md:px-6 mb-2 min-w-0">
          <h2 id={headingId} className="catalog-section-title font-syne font-bold truncate min-w-0 text-sm">
            {title}
          </h2>
          {countLabel != null && (
            <span className="text-[10px] sm:text-xs text-muted shrink-0 tabular-nums">{countLabel}</span>
          )}
        </div>
      )}

      <div
        className={[
          gridClassForLayout(cardTheme.catalogLayout),
          isFeed ? 'px-0' : 'px-4 md:px-6',
        ].join(' ')}
      >
        {displayItems.map(({ product, variantIndex }) => (
          <div
            key={`${product.id}-${variantIndex}`}
            className={[
              'min-w-0 flex flex-col self-stretch',
              isList ? 'catalog-grid-list-item' : 'h-full',
            ].join(' ')}
          >
            <ProdutoCard
              product={product}
              displayVariantIndex={variantIndex}
              onAddToCart={onAddToCart}
              onInteract={onInteract}
              onProductFocus={onProductFocus}
              layout="vitrine"
              cardTheme={cardTheme}
              storeSlug={store.slug}
              installmentsMaxNoInterest={installmentsMaxNoInterest}
              customCategories={customCategories}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
