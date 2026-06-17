'use client'

import { useEffect, useRef } from 'react'
import { generateThemeCss } from '@/lib/theme-css'
import { getGoogleFontsUrl } from '@/lib/theme-fonts'
import type { CustomCategory } from '@/types'
import { previewChipFilters, type StorePreviewProduct } from '@/lib/preview-products'
import { getTheme, themeToCardConfig, type ThemeBackground, type ThemeName } from '@/lib/themes'
import CategoryFilterBar from '@/components/loja/CategoryFilterBar'
import LojaBrand from '@/components/loja/LojaBrand'
import { normalizeLogoSize, type LogoSize } from '@/lib/store-logo'
import {
  normalizeBrandDisplay,
  normalizeHeaderLayout,
  normalizeLogoShape,
  normalizeShowSearch,
  resolveCatalogColsMobile,
  type BrandDisplay,
  type HeaderLayout,
  type LogoShape,
} from '@/lib/vitrine-layout'
import type { PlanSlug } from '@/lib/plans'

type Props = {
  themeName:          ThemeName
  primary:            string
  accent:             string
  background:         ThemeBackground
  shimmer:            boolean
  storeName:          string
  logoUrl:            string | null
  products:           StorePreviewProduct[]
  assistantName:      string
  tagline?:           string | null
  categoryNavStyle?:  'pills' | 'circles'
  customCategories?:  CustomCategory[]
  highlightedColor?:  'primary' | 'accent' | null
  plan?:              PlanSlug
  headerLayout?:      HeaderLayout
  logoShape?:         LogoShape
  brandDisplay?:      BrandDisplay
  showSearch?:        boolean
  logoSize?:          LogoSize
  mobileGridCols?:    2 | 3
  storeSlug?:         string
}

function formatPrice(value: number): string {
  return `R$${value.toFixed(2).replace('.', ',')}`
}

function previewGridClass(layout: ReturnType<typeof themeToCardConfig>['catalogLayout']): string {
  switch (layout) {
    case 'grid-dense':
      return 'catalog-grid catalog-grid-dense'
    case 'grid-feed':
      return 'catalog-grid catalog-grid-feed'
    case 'list':
      return 'catalog-grid catalog-grid-list'
    case 'strip':
      return 'flex gap-[var(--theme-card-gap)] overflow-x-auto pb-1 scrollbar-hide'
    default:
      return 'catalog-grid'
  }
}

export default function StoreThemePreview({
  themeName,
  primary,
  accent,
  background,
  shimmer,
  storeName,
  logoUrl,
  products,
  assistantName,
  tagline,
  categoryNavStyle = 'pills',
  customCategories = [],
  highlightedColor = null,
  plan = 'free',
  headerLayout: headerLayoutProp,
  logoShape: logoShapeProp,
  brandDisplay: brandDisplayProp,
  showSearch: showSearchProp,
  logoSize: logoSizeProp,
  mobileGridCols: mobileGridColsProp,
  storeSlug = 'sua-loja',
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const theme = getTheme(themeName)
  const card = themeToCardConfig(theme, shimmer)
  const chipFilters = previewChipFilters(products, customCategories)
  const displayProducts = products.length > 0 ? products.slice(0, 6) : []
  const placeholders = displayProducts.length === 0 ? 3 : 0
  const navStyle = categoryNavStyle ?? theme.categoryNavDefault

  const hasLogo = Boolean(logoUrl?.trim())
  const headerLayout = normalizeHeaderLayout(headerLayoutProp)
  const logoShape = normalizeLogoShape(logoShapeProp)
  const brandDisplay = normalizeBrandDisplay(brandDisplayProp, hasLogo)
  const showSearch = normalizeShowSearch(showSearchProp)
  const logoSize = normalizeLogoSize(logoSizeProp)
  const catalogColsMobile = resolveCatalogColsMobile(
    themeName,
    { mobileGridCols: mobileGridColsProp },
    plan,
  )

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    el.style.cssText = generateThemeCss(
      theme,
      { primary, accent },
      background,
      shimmer,
      { catalogColsMobile },
    )
  }, [theme, themeName, primary, accent, background, shimmer, catalogColsMobile])

  useEffect(() => {
    const id = 'store-theme-preview-fonts'
    let link = document.getElementById(id) as HTMLLinkElement | null
    const href = getGoogleFontsUrl(theme)
    if (!link) {
      link = document.createElement('link')
      link.id = id
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }
    if (link.href !== href) link.href = href
  }, [theme])

  const gridClass = previewGridClass(card.catalogLayout)
  const highlightClass =
    highlightedColor === 'primary'
      ? 'highlight-primary'
      : highlightedColor === 'accent'
        ? 'highlight-accent'
        : ''

  const previewHeader =
    headerLayout === 'centered' ? (
      <div className="loja-header-hero px-3 pt-4 pb-4 border-b border-border text-center">
        <LojaBrand
          slug={storeSlug}
          storeName={storeName}
          logoUrl={logoUrl}
          logoSize={logoSize}
          logoShape={logoShape}
          brandDisplay={brandDisplay}
          tagline={tagline}
          variant="hero"
        />
      </div>
    ) : (
      <header className="loja-header px-3 py-2.5 border-b border-border flex items-center gap-2 min-w-0">
        <LojaBrand
          slug={storeSlug}
          storeName={storeName}
          logoUrl={logoUrl}
          logoSize={logoSize}
          logoShape={logoShape}
          brandDisplay={brandDisplay}
          tagline={tagline}
          variant="bar"
          className="flex-1 min-w-0"
        />
      </header>
    )

  return (
    <div
      ref={rootRef}
      className={`store-theme-root store-theme-preview rounded-2xl border border-border overflow-hidden min-h-[320px] max-w-full ${highlightClass}`}
      data-theme={themeName}
      data-info-position={card.infoPosition}
      data-card-hover={card.cardHover}
      data-catalog-layout={card.catalogLayout}
      data-catalog-cols-mobile={catalogColsMobile}
      style={{ fontFamily: `var(--theme-font-body), sans-serif` }}
    >
      {previewHeader}

      {showSearch && (
        <div className="px-3 pt-3 min-w-0">
          <div className="h-10 rounded-2xl border border-border bg-surface2/80 flex items-center px-3 gap-2 min-w-0">
            <span className="text-muted text-xs shrink-0" aria-hidden>⌕</span>
            <span className="text-[11px] text-muted truncate">Buscar produtos…</span>
          </div>
        </div>
      )}

      <div className={`px-3 min-w-0 ${showSearch ? 'pt-2 pb-2' : 'py-2'}`}>
        <CategoryFilterBar
          filters={chipFilters}
          activeValue={chipFilters[1]?.value ?? chipFilters[0]?.value ?? ''}
          onSelect={() => {}}
          customCategories={customCategories}
          categoryNavStyle={navStyle}
          textOnly
        />
      </div>

      {displayProducts.length === 0 ? (
        <div className="px-3 pb-2">
          <p className="text-[11px] text-muted break-words mb-2">
            Cadastre produtos com foto para ver o preview real do catálogo.
          </p>
          <div className={gridClass}>
            {Array.from({ length: placeholders || 3 }).map((_, i) => (
              <div
                key={i}
                className="produto-card border overflow-hidden opacity-60 min-w-0"
                style={{ borderRadius: card.borderRadius }}
              >
                <div
                  className="produto-card-media w-full"
                  style={{ aspectRatio: card.aspectRatio }}
                >
                  <div
                    className="w-full h-full"
                    style={{ background: 'var(--theme-card-bg)' }}
                  />
                </div>
                <div className="card-info-below p-2">
                  <div className="h-2 w-3/4 rounded bg-border/60 mb-1" />
                  <div className="h-2 w-1/2 rounded bg-border/40" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : card.catalogLayout === 'strip' ? (
        <div className={`${gridClass} px-3 pb-2`}>
          {displayProducts.map(p => (
            <div
              key={p.name}
              className="produto-card overflow-hidden shrink-0 w-[42%] min-w-[100px] max-w-[140px]"
              data-shimmer={shimmer ? 'true' : 'false'}
              style={{ borderRadius: card.borderRadius }}
            >
              {p.photo ? (
                <img src={p.photo} alt="" className="produto-card-media w-full object-cover" style={{ aspectRatio: card.aspectRatio }} />
              ) : (
                <div
                  className="produto-card-media w-full"
                  style={{
                    aspectRatio: card.aspectRatio,
                    background: `linear-gradient(145deg, var(--primary-dim), var(--accent-dim))`,
                  }}
                />
              )}
              <div className="card-info-below p-2 min-w-0">
                <p className="produto-nome text-[10px] font-semibold truncate">{p.name}</p>
                <p className="preview-price produto-preco text-[10px] tabular-nums">{formatPrice(p.price)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`${gridClass} p-3`}>
          {displayProducts.map(p => (
            <div
              key={p.name}
              className="produto-card overflow-hidden min-w-0"
              data-shimmer={shimmer ? 'true' : 'false'}
              style={{ borderRadius: card.borderRadius }}
            >
              {p.photo ? (
                <img
                  src={p.photo}
                  alt=""
                  className="produto-card-media w-full object-cover"
                  style={{ aspectRatio: card.aspectRatio }}
                />
              ) : (
                <div
                  className="produto-card-media w-full"
                  style={{
                    aspectRatio: card.aspectRatio,
                    background: `linear-gradient(145deg, var(--primary-dim), var(--accent-dim))`,
                  }}
                />
              )}
              <div className="card-info-below p-2 min-w-0">
                <p className="produto-nome text-[10px] font-semibold truncate">{p.name}</p>
                <p className="preview-price produto-preco text-[10px] tabular-nums">{formatPrice(p.price)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        className="preview-vi-bubble mx-3 mb-3 p-2 rounded-xl border text-[10px] break-words"
        style={{ borderColor: 'var(--theme-card-border)', color: 'var(--theme-text-muted)', background: 'var(--theme-vi-bubble)' }}
      >
        <span className="font-semibold preview-vi-name" style={{ color: 'var(--theme-primary)' }}>
          {assistantName} ·{' '}
        </span>
        Olá! Posso ajudar você a encontrar o look ideal?
      </div>
    </div>
  )
}
