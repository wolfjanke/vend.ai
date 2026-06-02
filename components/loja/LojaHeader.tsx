'use client'

import type { ThemeName } from '@/lib/themes'
import { getStoreInitials } from '@/lib/store-brand'

type Props = {
  slug:        string
  storeName:   string
  whatsapp:    string
  logoUrl:     string | null
  tagline?:    string | null
  themeName:   ThemeName
  cartQty:     number
  onOpenCart:  () => void
}

export default function LojaHeader({
  slug,
  storeName,
  whatsapp,
  logoUrl,
  tagline,
  themeName,
  cartQty,
  onOpenCart,
}: Props) {
  const letterSpacing = themeName === 'street' ? '2px' : '-0.3px'

  return (
    <header className="loja-header sticky top-0 z-50 h-16 px-4 md:px-6 animate-slide-down">
      <div className="mx-auto flex h-full w-full max-w-5xl items-center justify-between gap-3 min-w-0">
        <a href={`/${slug}`} className="flex items-center gap-3 min-w-0 min-h-[44px]">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={storeName}
              className="h-11 w-auto max-w-[120px] shrink-0 rounded-lg object-contain"
            />
          ) : (
            <div
              className="w-11 h-11 shrink-0 rounded-[10px] flex items-center justify-center text-sm font-bold text-white"
              style={{ background: 'var(--theme-vi-avatar)' }}
              aria-hidden
            >
              {getStoreInitials(storeName)}
            </div>
          )}
          <div className="min-w-0">
            <span
              className="loja-brand-name block text-lg sm:text-xl truncate"
              style={{ letterSpacing }}
            >
              {storeName}
            </span>
            {tagline?.trim() && (
              <span className="block text-[11px] text-muted truncate max-w-[200px] sm:max-w-none">
                {tagline.trim()}
              </span>
            )}
          </div>
        </a>

        <div className="flex gap-2.5 items-center shrink-0">
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all min-h-[44px]"
            style={{
              background: 'var(--theme-primary-surface)',
              border:     '1px solid var(--theme-primary-border)',
              color:      'var(--theme-primary)',
            }}
          >
            Vendedor
          </a>
          <button
            type="button"
            onClick={onOpenCart}
            className="relative min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center transition-all"
            style={{
              background: 'var(--theme-card-bg)',
              border:     '1px solid var(--theme-card-border)',
              color:      'var(--theme-text)',
            }}
            aria-label="Abrir carrinho"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {cartQty > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 min-w-[18px] min-h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1"
                style={{ background: 'var(--theme-btn-bg)', color: 'var(--theme-btn-text)' }}
              >
                {cartQty}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
