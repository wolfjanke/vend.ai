'use client'

import { useState } from 'react'
import type { Product, CartItem } from '@/types'

interface Props {
  product:     Product
  onAddToCart: (item: CartItem) => void
  onInteract?: () => void
}

export default function ProdutoCard({ product, onAddToCart, onInteract }: Props) {
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0)
  const [selectedSize,       setSelectedSize]       = useState<string | null>(null)
  const [added,              setAdded]              = useState(false)

  const variant  = product.variants_json[selectedVariantIdx]
  const allSizes = variant
    ? Object.entries(variant.stock).filter(([, q]) => Number(q) > 0).map(([s]) => s)
    : []

  const isSoldOut = product.variants_json.every(v =>
    Object.values(v.stock).every(q => Number(q) === 0)
  )
  const totalStock = product.variants_json.reduce(
    (sum, v) => sum + Object.values(v.stock).reduce((a, b) => Number(a) + Number(b), 0), 0
  )
  const isLowStock = totalStock > 0 && totalStock <= 3

  function handleAdd() {
    const size = selectedSize ?? allSizes[0]
    if (!size || !variant) return

    onInteract?.()
    onAddToCart({
      product_id: product.id,
      variant_id: variant.id,
      name:       product.name,
      size,
      color:      variant.color,
      qty:        1,
      price:      Number(product.promo_price ?? product.price),
      photo:      variant.photos[0],
    })

    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="bg-surface border border-border rounded-[20px] overflow-hidden hover:-translate-y-1 hover:border-primary hover:shadow-[0_8px_40px_var(--primary-glow),0_0_0_1px_var(--primary-dim)] transition-all duration-300">

      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-surface2">
        {variant?.photos[0] ? (
          <img src={variant.photos[0]} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">👗</div>
        )}

        {isSoldOut && (
          <>
            <div className="absolute inset-0 bg-bg/70" />
            <div className="absolute inset-0 flex items-center justify-center font-syne font-bold text-muted tracking-[2px] uppercase text-sm">ESGOTADO</div>
          </>
        )}
        {isLowStock && !isSoldOut && (
          <span className="absolute top-2.5 left-2.5 px-2.5 py-1 bg-warm/20 border border-warm/20 rounded-lg text-warm text-[11px] font-bold uppercase tracking-wide">
            Últimas unidades
          </span>
        )}
        {product.promo_price && !isSoldOut && (
          <span className="absolute top-2.5 left-2.5 px-2.5 py-1 bg-primary/20 border border-primary/30 rounded-lg text-primary text-[11px] font-bold uppercase tracking-wide">
            Promoção
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3.5">
        <h3 className="font-syne font-semibold text-sm truncate mb-1.5">{product.name}</h3>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-accent font-bold text-base">
            R${Number(product.promo_price ?? product.price).toFixed(2).replace('.', ',')}
          </span>
          {product.promo_price && (
            <span className="text-muted text-xs line-through">
              R${Number(product.price).toFixed(2).replace('.', ',')}
            </span>
          )}
        </div>

        {/* Color variants */}
        {product.variants_json.length > 1 && (
          <div className="flex gap-1.5 mb-2.5">
            {product.variants_json.map((v, i) => (
              <button
                key={v.id}
                onClick={() => { setSelectedVariantIdx(i); setSelectedSize(null); onInteract?.() }}
                title={v.color}
                className={`w-5 h-5 rounded-full border-2 transition-all ${i === selectedVariantIdx ? 'border-primary scale-110' : 'border-transparent'}`}
                style={{ background: v.colorHex }}
              />
            ))}
          </div>
        )}

        {/* Sizes */}
        {!isSoldOut && (
          <div className="flex gap-1.5 flex-wrap mb-3">
            {allSizes.length > 0 ? allSizes.map(s => (
              <button
                key={s}
                onClick={() => { setSelectedSize(s); onInteract?.() }}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                  selectedSize === s
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-surface2 border-border text-muted hover:border-primary hover:text-primary'
                }`}
              >
                {s}
              </button>
            )) : (
              <span className="text-xs text-muted">Sem estoque nesta cor</span>
            )}
          </div>
        )}

        {isSoldOut ? (
          <div className="w-full py-2.5 text-center text-xs text-muted border border-border rounded-xl cursor-not-allowed">
            Produto esgotado
          </div>
        ) : (
          <button
            onClick={handleAdd}
            disabled={allSizes.length === 0}
            className={`w-full py-2.5 rounded-xl text-xs font-semibold border transition-all ${
              added
                ? 'bg-accent/20 border-accent text-accent'
                : 'bg-primary/10 border-primary text-primary hover:bg-primary hover:text-white hover:shadow-[0_4px_20px_var(--primary-glow)]'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {added ? '✓ Adicionado!' : '+ Adicionar'}
          </button>
        )}
      </div>
    </div>
  )
}
