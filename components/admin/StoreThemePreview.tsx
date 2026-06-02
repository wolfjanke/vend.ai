'use client'

import { useEffect, useRef } from 'react'
import { generateThemeCss } from '@/lib/theme-css'
import { getGoogleFontsUrl } from '@/lib/theme-fonts'
import { getStoreInitials } from '@/lib/store-brand'
import { previewChipLabels, type StorePreviewProduct } from '@/lib/preview-products'
import { getTheme, themeToCardConfig, type ThemeBackground, type ThemeName } from '@/lib/themes'

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
}

function formatPrice(value: number): string {
  return `R$${value.toFixed(2).replace('.', ',')}`
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
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const theme = getTheme(themeName)
  const card = themeToCardConfig(theme, shimmer)
  const chips = previewChipLabels(products)
  const displayProducts = products.length > 0 ? products.slice(0, 4) : []
  const placeholders = displayProducts.length === 0 ? 2 : 0

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

  return (
    <div
      ref={rootRef}
      className="store-theme-root rounded-2xl border border-border overflow-hidden min-h-[320px] max-w-full"
      data-theme={themeName}
      data-info-position={card.infoPosition}
      style={{ fontFamily: `var(--theme-font-body), sans-serif` }}
    >
      <header className="loja-header px-3 py-2.5 border-b border-border flex items-center gap-2.5 min-w-0">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            className="h-11 w-auto max-w-[100px] shrink-0 rounded-lg object-contain"
          />
        ) : (
          <div
            className="w-11 h-11 shrink-0 rounded-[10px] flex items-center justify-center text-xs font-bold text-white"
            style={{ background: 'var(--theme-vi-avatar)' }}
            aria-hidden
          >
            {getStoreInitials(storeName)}
          </div>
        )}
        <div className="min-w-0">
          <span
            className="loja-brand-name block text-sm font-bold truncate"
            style={{ fontFamily: 'var(--theme-font-display), sans-serif' }}
          >
            {storeName}
          </span>
          {tagline?.trim() && (
            <span className="block text-[10px] text-muted truncate">{tagline.trim()}</span>
          )}
        </div>
      </header>

      <div className="px-3 py-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
        {chips.map((label, i) => (
          <span
            key={label}
            className={`filter-chip shrink-0 px-2.5 py-1 text-[10px] ${i === 0 ? 'active' : ''}`}
          >
            {label}
          </span>
        ))}
      </div>

      {displayProducts.length === 0 ? (
        <div className="px-3 pb-2">
          <p className="text-[11px] text-muted break-words mb-2">
            Cadastre produtos com foto para ver o preview real do catálogo.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: placeholders || 2 }).map((_, i) => (
              <div
                key={i}
                className="produto-card border overflow-hidden opacity-60"
                style={{
                  borderRadius: card.borderRadius,
                  aspectRatio:  card.aspectRatio,
                }}
              >
                <div
                  className="w-full h-[55%]"
                  style={{ background: 'var(--theme-card-bg)' }}
                />
                <div className="p-2">
                  <div className="h-2 w-3/4 rounded bg-border/60 mb-1" />
                  <div className="h-2 w-1/2 rounded bg-border/40" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 p-3">
          {displayProducts.map(p => (
            <div
              key={p.name}
              className="produto-card overflow-hidden"
              data-shimmer={shimmer ? 'true' : 'false'}
              style={{
                borderRadius: card.borderRadius,
                aspectRatio:  card.aspectRatio,
              }}
            >
              {p.photo ? (
                <img
                  src={p.photo}
                  alt=""
                  className="w-full h-[55%] object-cover"
                />
              ) : (
                <div
                  className="w-full h-[55%]"
                  style={{
                    background: `linear-gradient(145deg, var(--primary-dim), var(--accent-dim))`,
                  }}
                />
              )}
              <div className="card-info-below p-2 min-w-0">
                <p className="produto-nome text-[10px] font-semibold truncate">{p.name}</p>
                <p className="produto-preco text-[10px] tabular-nums">{formatPrice(p.price)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        className="mx-3 mb-3 p-2 rounded-xl border text-[10px] break-words"
        style={{ borderColor: 'var(--theme-card-border)', color: 'var(--theme-text-muted)' }}
      >
        <span className="font-semibold" style={{ color: 'var(--theme-primary)' }}>
          {assistantName} ·{' '}
        </span>
        Olá! Posso ajudar você a encontrar o look ideal?
      </div>
    </div>
  )
}
