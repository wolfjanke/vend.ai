'use client'

import { useEffect, useState } from 'react'
import type { Product, ProductVariant } from '@/types'
import { resolveSkuUnitPrice } from '@/lib/product-pricing'
import { formatPdvCurrency, stockKeysWithQty } from './pdv-utils'
import PdvProductThumb from './PdvProductThumb'

interface Props {
  product:   Product | null
  onClose:   () => void
  onSelect:  (variant: ProductVariant, size: string) => void
}

function PickerContent({
  product,
  onClose,
  onSelect,
}: {
  product:  Product
  onClose:  () => void
  onSelect: (variant: ProductVariant, size: string) => void
}) {
  const variants = product.variants_json ?? []
  const [colorIdx, setColorIdx] = useState(0)
  const selected = variants[colorIdx] ?? variants[0]
  const sizes = selected ? stockKeysWithQty(selected) : []

  useEffect(() => {
    setColorIdx(0)
  }, [product.id])

  function handleSize(size: string) {
    if (!selected) return
    onSelect(selected, size)
    onClose()
  }

  return (
    <>
      <div className="flex items-start gap-3 mb-4 min-w-0">
        <PdvProductThumb product={product} variant={selected} className="w-14 h-14 rounded-xl shrink-0 overflow-hidden border border-border" />
        <div className="flex-1 min-w-0">
          <div className="font-syne font-bold text-sm line-clamp-2 break-words">{product.name}</div>
          <div className="text-accent text-sm tabular-nums mt-0.5">{formatPdvCurrency(Number(product.price))}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-foreground rounded-xl border border-border"
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>

      {variants.length > 1 && (
        <div className="mb-4">
          <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Cor</div>
          <div className="flex flex-wrap gap-2">
            {variants.map((v, i) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setColorIdx(i)}
                className={`flex items-center gap-2 min-h-[44px] px-3 py-2 rounded-xl border text-sm transition-colors ${
                  i === colorIdx
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-surface2 text-foreground hover:border-primary/50'
                }`}
              >
                <span
                  className="w-4 h-4 rounded-full border border-border/50 shrink-0"
                  style={{ background: v.colorHex }}
                />
                <span className="break-words">{v.color}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
          {variants.length <= 1 && selected ? `Cor: ${selected.color} — ` : ''}Tamanho
        </div>
        {selected && sizes.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {sizes.map(s => {
              const skuPrice = resolveSkuUnitPrice(product, selected, s)
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSize(s)}
                  className="min-h-[44px] px-2 py-2 border border-border rounded-xl text-sm font-medium hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors break-words"
                >
                  {s}
                  {selected.stockPrices?.[s] != null && (
                    <span className="block text-[10px] text-muted tabular-nums">{formatPdvCurrency(skuPrice)}</span>
                  )}
                </button>
              )
            })}
          </div>
        ) : selected ? (
          <button
            type="button"
            onClick={() => handleSize('Único')}
            className="w-full min-h-[44px] py-3 bg-primary text-white font-syne font-bold text-sm rounded-xl hover:shadow-[0_4px_20px_var(--primary-glow)] transition-all"
          >
            Adicionar ao carrinho
          </button>
        ) : (
          <p className="text-sm text-muted py-2">Sem variações disponíveis</p>
        )}
      </div>
    </>
  )
}

export default function PdvVariantPicker({ product, onClose, onSelect }: Props) {
  useEffect(() => {
    if (!product) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [product, onClose])

  if (!product) return null

  return (
    <>
      {/* Mobile: bottom sheet */}
      <button
        type="button"
        aria-label="Fechar seleção"
        className="fixed inset-0 z-[55] bg-bg/70 backdrop-blur-sm xl:hidden"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Escolher cor e tamanho"
        className="fixed left-0 right-0 z-[56] xl:hidden max-w-[100vw] border border-border border-b-0 bg-surface rounded-t-[20px] shadow-[0_-12px_40px_rgba(0,0,0,0.45)] p-4 pb-6"
        style={{
          bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div className="w-10 h-1 rounded-full bg-border mx-auto mb-4 shrink-0" aria-hidden />
        <PickerContent product={product} onClose={onClose} onSelect={onSelect} />
      </div>

      {/* Desktop: modal centrado */}
      <button
        type="button"
        aria-label="Fechar seleção"
        className="hidden xl:block fixed inset-0 z-[55] bg-bg/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Escolher cor e tamanho"
        className="hidden xl:block fixed left-1/2 top-1/2 z-[56] -translate-x-1/2 -translate-y-1/2 w-full max-w-[min(28rem,calc(100vw-16px))] bg-surface border border-border rounded-2xl shadow-xl p-5"
      >
        <PickerContent product={product} onClose={onClose} onSelect={onSelect} />
      </div>
    </>
  )
}
