'use client'

import type { ThemeName } from '@/lib/themes'
import { getStoreInitials } from '@/lib/store-brand'
import { vitrineText } from '@/lib/strip-emoji'
import {
  logoFallbackClassName,
  logoHeaderClassName,
  logoHeaderShellClassName,
  normalizeLogoSize,
  type LogoSize,
} from '@/lib/store-logo'

type Props = {
  slug:        string
  storeName:   string
  whatsapp:    string
  logoUrl:     string | null
  logoSize?:   LogoSize
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
  logoSize = 'md',
  tagline,
  themeName,
  cartQty,
  onOpenCart,
}: Props) {
  const letterSpacing = themeName === 'street' ? '2px' : '-0.3px'
  const displayName = vitrineText(storeName)
  const displayTagline = tagline?.trim() ? vitrineText(tagline) : null
  const size = normalizeLogoSize(logoSize)

  return (
    <header className={`loja-header sticky top-0 z-50 px-4 md:px-6 animate-slide-down ${logoHeaderShellClassName(size)}`}>
      <div className="mx-auto flex h-full w-full max-w-5xl items-center justify-between gap-3 min-w-0">
        <a href={`/${slug}`} className="flex items-center gap-3 min-w-0 min-h-[44px]">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={storeName}
              className={logoHeaderClassName(size)}
            />
          ) : (
            <div
              className={logoFallbackClassName(size)}
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
              {displayName}
            </span>
            {displayTagline && (
              <span className="block text-[11px] text-muted truncate max-w-[200px] sm:max-w-none">
                {displayTagline}
              </span>
            )}
          </div>
        </a>

        <div className="flex gap-2.5 items-center shrink-0">
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noreferrer"
            aria-label="Falar com vendedor no WhatsApp"
            className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs font-medium transition-all min-h-[44px] min-w-[44px] sm:min-w-0"
            style={{
              background: 'var(--theme-primary-surface)',
              border:     '1px solid var(--theme-primary-border)',
              color:      'var(--theme-primary)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="shrink-0">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span className="hidden sm:inline">Vendedor</span>
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
