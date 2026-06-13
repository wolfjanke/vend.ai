'use client'

import { useEffect, useRef } from 'react'
import { generateThemeCss } from '@/lib/theme-css'
import { getGoogleFontsUrl } from '@/lib/theme-fonts'
import { getStoreInitials } from '@/lib/store-brand'
import type { CustomCategory } from '@/types'
import { previewChipFilters, type StorePreviewProduct } from '@/lib/preview-products'
import { getTheme, themeToCardConfig, type ThemeBackground, type ThemeName } from '@/lib/themes'
import CategoryFilterBar from '@/components/loja/CategoryFilterBar'

type Props = {
  themeName:     ThemeName
  primary:       string
  accent:        string
  background:    ThemeBackground
  shimmer:       boolean
  storeName:     string
  logoUrl:       string | null
  products:      StorePreviewProduct[]
  assistantName: string
  tagline?:      string | null
  categoryNavStyle?: 'pills' | 'circles'
  customCategories?: CustomCategory[]
  highlightedColor?: 'primary' | 'accent' | null
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
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const theme = getTheme(themeName)
  const card = themeToCardConfig(theme, shimmer)
  const chipFilters = previewChipFilters(products, customCategories)
  const displayProducts = products.length > 0 ? products.slice(0, 4) : []
  const placeholders = displayProducts.length === 0 ? 2 : 0
  const navStyle = categoryNavStyle ?? theme.categoryNavDefault

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    el.style.cssText = generateThemeCss(
      theme,
      { primary, accent },
      background,
      shimmer,
    )
  }, [theme, themeName, primary, accent, background, shimmer])

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

  return (
    <div
      ref={rootRef}
      className={`store-theme-root store-theme-preview rounded-2xl border border-border overflow-hidden min-h-[320px] max-w-full ${highlightClass}`}
      data-theme={themeName}
      data-info-position={card.infoPosition}
      data-card-hover={card.cardHover}
      data-catalog-layout={card.catalogLayout}
      style={{ fontFamily: `var(--theme-font-body), sans-serif` }}
    >
      <header className="loja-header px-3 py-2.5 border-b border-border flex items-center gap-[10px] min-w-0">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            className="h-10 w-auto max-w-[120px] shrink-0 rounded-lg object-contain"
          />
        ) : (
          <div
            className="preview-vi-avatar w-10 h-10 shrink-0 rounded-[10px] flex items-center justify-center text-xs font-bold text-white"
            style={{ background: 'var(--theme-vi-avatar)' }}
            aria-hidden
          >
            {getStoreInitials(storeName)}
          </div>
        )}
        <div className="min-w-0">
          <span
            className="loja-brand-name block truncate font-bold"
            style={{
              fontFamily: 'var(--theme-font-display), sans-serif',
              fontSize:   '18px',
              fontWeight: 700,
            }}
          >
            {storeName}
          </span>
          {tagline?.trim() && (
            <span className="block text-[10px] text-muted truncate">{tagline.trim()}</span>
          )}
        </div>
      </header>

      <div className="px-3 py-2 min-w-0">
        <CategoryFilterBar
          filters={chipFilters}
          activeValue={chipFilters[1]?.value ?? chipFilters[0]?.value ?? ''}
          onSelect={() => {}}
          customCategories={customCategories}
          categoryNavStyle={navStyle}
          textOnly
        />
      </div>

      <div className="px-3 pb-2 flex flex-wrap gap-2 items-center">
        <button
          type="button"
          className="preview-btn-primary min-h-[36px] px-3 rounded-lg text-[10px] font-semibold shrink-0"
          style={{
            background: 'var(--theme-btn-bg)',
            color:      'var(--theme-btn-text)',
            borderRadius: 'var(--theme-btn-radius)',
          }}
        >
          Adicionar ao carrinho
        </button>
        <span className="preview-badge px-2 py-0.5 rounded-full text-[9px] font-bold text-white shrink-0" style={{ background: 'var(--theme-accent)' }}>
          Promoção
        </span>
      </div>

      {displayProducts.length === 0 ? (
        <div className="px-3 pb-2">
          <p className="text-[11px] text-muted break-words mb-2">
            Cadastre produtos com foto para ver o preview real do catálogo.
          </p>
          <div className={gridClass}>
            {Array.from({ length: placeholders || 2 }).map((_, i) => (
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
