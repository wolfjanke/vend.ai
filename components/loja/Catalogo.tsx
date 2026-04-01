'use client'

import { useMemo, useState } from 'react'

import type { CartItem, CustomCategory, Product, ProductVariantDisplay, StoreProfile } from '@/types'
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_SLUGS,
  getCategoryDisplayLabel,
  getSearchPlaceholder,
} from '@/types'
import { expandProductsByVariant } from '@/lib/catalog-display'

import ProductStrip from './ProductStrip'

interface Props {
  products:    Product[]
  profile:     StoreProfile
  /** Categorias extras da loja (rótulos nos chips e seções). */
  customCategories?: CustomCategory[]
  onAddToCart: (item: CartItem) => void
  onInteract?: () => void
  installmentsMaxNoInterest?: number | null
}

const SMALL_CATEGORY_MAX = 2

type BuiltSection = { key: string; title: string; items: ProductVariantDisplay[] }

function buildCatalogSections(
  visible: ProductVariantDisplay[],
  customCategories: CustomCategory[] = []
): BuiltSection[] {
  const promoItems = visible.filter(({ product: p }) => p.promo_price != null)
  const nonPromo = visible.filter(({ product: p }) => p.promo_price == null)

  const sections: BuiltSection[] = []
  if (promoItems.length > 0) {
    sections.push({
      key:   'promo',
      title: '🔥 Promoções',
      items: promoItems,
    })
  }

  const outros: ProductVariantDisplay[] = []

  for (const cat of PRODUCT_CATEGORIES) {
    const items = nonPromo.filter(({ product: p }) => p.category === cat.value)
    if (items.length === 0) continue
    if (items.length <= SMALL_CATEGORY_MAX) {
      outros.push(...items)
    } else {
      sections.push({ key: cat.value, title: cat.label, items })
    }
  }

  for (const cat of customCategories) {
    const items = nonPromo.filter(({ product: p }) => p.category === cat.value)
    if (items.length === 0) continue
    if (items.length <= SMALL_CATEGORY_MAX) {
      outros.push(...items)
    } else {
      sections.push({ key: cat.value, title: cat.label, items })
    }
  }

  const customSlugSet = new Set(customCategories.map(c => c.value))
  const known = new Set([...PRODUCT_CATEGORY_SLUGS, ...customSlugSet])
  const stray = nonPromo.filter(({ product: p }) => !known.has(p.category))
  if (stray.length > 0) {
    const byCat = new Map<string, ProductVariantDisplay[]>()
    for (const row of stray) {
      const k = (row.product.category || 'outro').trim() || 'outro'
      if (!byCat.has(k)) byCat.set(k, [])
      byCat.get(k)!.push(row)
    }
    for (const [slug, items] of Array.from(byCat.entries())) {
      if (items.length <= SMALL_CATEGORY_MAX) {
        outros.push(...items)
      } else {
        const label = getCategoryDisplayLabel(slug, customCategories)
        sections.push({ key: `stray-${slug}`, title: label, items })
      }
    }
  }

  if (outros.length > 0) {
    sections.push({
      key:   'outros-produtos',
      title: '📦 Outros produtos',
      items: outros,
    })
  }

  return sections
}

export default function Catalogo({
  products,
  profile,
  customCategories = [],
  onAddToCart,
  onInteract,
  installmentsMaxNoInterest = null,
}: Props) {
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')

  const visibleProducts = useMemo(() => products.filter(p => p.active !== false), [products])

  /** Filtros disponíveis: apenas categorias com ao menos 1 produto ativo + Promoções se houver */
  const availableFilters = useMemo(() => {
    const hasPromo = visibleProducts.some(p => p.promo_price != null)

    // Categorias presentes nos produtos ativos, mantendo a ordem de PRODUCT_CATEGORIES
    const presentSlugs = new Set(visibleProducts.map(p => p.category))
    const categoryFilters = PRODUCT_CATEGORIES.filter(c => presentSlugs.has(c.value))
    const customFilters = customCategories.filter(c => presentSlugs.has(c.value))

    return [
      { value: '', label: 'Tudo' },
      ...categoryFilters,
      ...customFilters,
      ...(hasPromo ? [{ value: 'sale', label: '🔥 Promoções' }] : []),
    ]
  }, [visibleProducts, customCategories])

  const expandedVisible = useMemo(
    () => expandProductsByVariant(visibleProducts),
    [visibleProducts]
  )

  const filtered = useMemo(() => {
    let list = expandedVisible
    if (catFilter === 'sale') {
      list = list.filter(({ product: p }) => p.promo_price !== null)
    } else if (catFilter) {
      list = list.filter(({ product: p }) => p.category === catFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(({ product: p, variantIndex: vi }) => {
        const v = p.variants_json[vi]
        const colorMatch = v?.color?.toLowerCase().includes(q) ?? false
        return (
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          colorMatch
        )
      })
    }
    return list
  }, [expandedVisible, catFilter, search])

  const isFiltered = Boolean(search.trim() || catFilter)

  const sectionList = useMemo(
    () => buildCatalogSections(expandedVisible, customCategories),
    [expandedVisible, customCategories]
  )

  const filteredTitle = useMemo(() => {
    if (catFilter === 'sale') return '🔥 Promoções'
    if (catFilter) {
      return getCategoryDisplayLabel(catFilter, customCategories)
    }
    if (search.trim()) return 'Resultados'
    return 'Produtos'
  }, [catFilter, search, customCategories])

  return (
    <div>
      <div className="mx-auto w-full max-w-5xl">
        <div className="relative z-10 px-4 md:px-6 pt-8 pb-0 animate-fade-up">
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => {
                setSearch(e.target.value)
                onInteract?.()
              }}
              className="w-full pl-11 pr-4 py-3.5 bg-surface border border-border rounded-2xl text-foreground text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-dim)] transition-all placeholder:text-muted"
              placeholder={getSearchPlaceholder(profile)}
            />
          </div>
        </div>

        <div className="relative z-10 px-4 md:px-6 pt-5 pb-0" style={{ animationDelay: '0.2s' }}>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {availableFilters.map(f => (
              <button
                key={f.value === '' ? 'all' : f.value}
                type="button"
                onClick={() => {
                  setCatFilter(f.value)
                  onInteract?.()
                }}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full border text-sm font-medium transition-all ${
                  catFilter === f.value
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-surface border-border text-muted hover:text-foreground'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {isFiltered ? (
          <div className="pb-32 pt-6">
            {filtered.length > 0 ? (
              <ProductStrip
                sectionId="filtered"
                title={filteredTitle}
                countLabel={`${filtered.length} ${filtered.length === 1 ? 'peça' : 'peças'}`}
                displayItems={filtered}
                onAddToCart={onAddToCart}
                onInteract={onInteract}
                installmentsMaxNoInterest={installmentsMaxNoInterest}
                customCategories={customCategories}
              />
            ) : (
              <div className="text-center py-20 text-muted px-6">
                <div className="text-5xl mb-3">🔍</div>
                <p className="font-medium">Nenhum produto encontrado</p>
                <p className="text-sm mt-1">Tente outro termo ou categoria</p>
              </div>
            )}
          </div>
        ) : (
          <div className="pb-32 pt-6">
            {sectionList.length > 0 ? (
              sectionList.map(sec => (
                <ProductStrip
                  key={sec.key}
                  sectionId={sec.key}
                  title={sec.title}
                  countLabel={`${sec.items.length} ${sec.items.length === 1 ? 'peça' : 'peças'}`}
                  displayItems={sec.items}
                  onAddToCart={onAddToCart}
                  onInteract={onInteract}
                  installmentsMaxNoInterest={installmentsMaxNoInterest}
                  customCategories={customCategories}
                />
              ))
            ) : (
              <div className="text-center py-20 text-muted px-6">
                <div className="text-5xl mb-3">🛍️</div>
                <p className="font-medium">Nenhum produto na vitrine</p>
                <p className="text-sm mt-1">Quando houver itens ativos, eles aparecerão aqui.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
