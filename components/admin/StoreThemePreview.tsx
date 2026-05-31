'use client'

import { useEffect, useRef } from 'react'
import { generateThemeCss } from '@/lib/theme-css'
import { getTheme, themeToCardConfig, type ThemeBackground, type ThemeName } from '@/lib/themes'

type Props = {
  themeName:   ThemeName
  primary:     string
  secondary:   string
  accent:      string
  background:  ThemeBackground
  shimmer:     boolean
}

export default function StoreThemePreview({
  themeName,
  primary,
  secondary,
  accent,
  background,
  shimmer,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const theme = getTheme(themeName)
  const card = themeToCardConfig(theme, shimmer)

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    el.style.cssText = generateThemeCss(
      theme,
      { primary, secondary, accent },
      background,
      shimmer,
    )
  }, [theme, themeName, primary, secondary, accent, background, shimmer])

  const mockProducts = [
    { name: 'Vestido Midi', price: 'R$189,90' },
    { name: 'Blusa Linho', price: 'R$79,90' },
    { name: 'Calça Wide', price: 'R$149,00' },
  ]

  return (
    <div
      ref={rootRef}
      className="rounded-2xl border border-border overflow-hidden min-h-[320px] max-w-full"
      style={{ fontFamily: `var(--theme-font-body), sans-serif` }}
    >
      <div className="px-3 py-2.5 border-b border-border flex items-center gap-2 min-w-0">
        <div
          className="w-8 h-8 rounded-lg shrink-0"
          style={{ background: `linear-gradient(135deg, var(--primary), var(--accent))` }}
        />
        <span
          className="font-bold text-sm truncate min-w-0"
          style={{ fontFamily: 'var(--theme-font-display), sans-serif' }}
        >
          Sua Loja
        </span>
      </div>
      <div className="px-3 py-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
        {['Todos', 'Novidades', 'Promo'].map(label => (
          <span
            key={label}
            className="shrink-0 px-2.5 py-1 rounded-full text-[10px] border"
            style={{
              borderColor: 'var(--primary)',
              color:         'var(--primary)',
              background:    'var(--primary-dim)',
            }}
          >
            {label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 p-3">
        {mockProducts.map((p, i) => (
          <div
            key={p.name}
            className="produto-card border overflow-hidden"
            data-shimmer={shimmer ? 'true' : 'false'}
            style={{
              borderRadius:   card.borderRadius,
              borderColor:    'var(--border)',
              background:     'var(--surface)',
              aspectRatio:    card.aspectRatio,
            }}
          >
            <div
              className="w-full h-[55%]"
              style={{
                background: `linear-gradient(145deg, var(--primary-dim), var(--accent-dim))`,
              }}
            />
            <div className="p-2 min-w-0">
              <p
                className="text-[10px] font-semibold truncate"
                style={{ fontFamily: 'var(--theme-font-display), sans-serif' }}
              >
                {p.name}
              </p>
              <p className="text-[10px] tabular-nums" style={{ color: 'var(--accent)' }}>
                {p.price}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div
        className="mx-3 mb-3 p-2 rounded-xl border text-[10px] break-words"
        style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
      >
        <span className="font-semibold" style={{ color: 'var(--primary)' }}>Vi · </span>
        Olá! Posso ajudar você a encontrar o look ideal?
      </div>
    </div>
  )
}
