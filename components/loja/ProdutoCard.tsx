'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Product, CartItem } from '@/types'
import { PRODUCT_CATEGORIES } from '@/types'

function categoryLabel(slug: string): string {
  return PRODUCT_CATEGORIES.find(c => c.value === slug)?.label ?? slug
}

function sumStock(v: Product['variants_json'][0]): number {
  return Object.values(v.stock).reduce((a, b) => Number(a) + Number(b), 0)
}

function firstVariantIndexWithStock(product: Product): number {
  const idx = product.variants_json.findIndex(v =>
    Object.values(v.stock).some(q => Number(q) > 0)
  )
  return idx >= 0 ? idx : 0
}

/** Valor de cada parcela em centavos para evitar drift de float. */
function installmentLabel(n: number, effectivePrice: number): string | null {
  if (!Number.isFinite(n) || n < 1 || !Number.isFinite(effectivePrice) || effectivePrice <= 0) return null
  const cents = Math.round(effectivePrice * 100)
  const perCents = Math.round(cents / n)
  const per = perCents / 100
  return `${n}x R$${per.toFixed(2).replace('.', ',')}`
}

interface Props {
  product:     Product
  /** Na vitrine, uma carta por variação: índice fixo dessa cor (evita “esconder” outras cores). */
  displayVariantIndex?: number
  onAddToCart: (item: CartItem) => void
  onInteract?: () => void
  /** Vitrine: só imagem + nome/preço/parcelas; cor, tamanho e compra no modal. */
  layout?:     'vitrine' | 'default'
  installmentsMaxNoInterest?: number | null
}

export default function ProdutoCard({
  product,
  displayVariantIndex,
  onAddToCart,
  onInteract,
  layout = 'default',
  installmentsMaxNoInterest = null,
}: Props) {
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(() =>
    displayVariantIndex ??
      (layout === 'vitrine' ? firstVariantIndexWithStock(product) : 0)
  )
  const [selectedSize,       setSelectedSize]       = useState<string | null>(null)
  const [added,              setAdded]              = useState(false)
  const [detailOpen,         setDetailOpen]         = useState(false)
  const [portalReady,        setPortalReady]        = useState(false)

  useEffect(() => {
    setPortalReady(true)
  }, [])

  useEffect(() => {
    setSelectedVariantIdx(
      displayVariantIndex ??
        (layout === 'vitrine' ? firstVariantIndexWithStock(product) : 0)
    )
    setSelectedSize(null)
  }, [product.id, layout, displayVariantIndex])

  useEffect(() => {
    if (!detailOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDetailOpen(false)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [detailOpen])

  const variant  = product.variants_json[selectedVariantIdx]
  const allSizes = variant
    ? Object.entries(variant.stock).filter(([, q]) => Number(q) > 0).map(([s]) => s)
    : []

  const variantTotalStock = variant
    ? Object.values(variant.stock).reduce((a, b) => Number(a) + Number(b), 0)
    : 0
  const isSoldOut =
    !variant || Object.values(variant.stock).every(q => Number(q) === 0)
  const isLowStock = variantTotalStock > 0 && variantTotalStock <= 3
  const cat = categoryLabel(product.category)

  function handleAdd(closeDetail?: boolean) {
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
      description: product.description?.trim() || undefined,
    })

    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
    if (closeDetail) setDetailOpen(false)
  }

  function openDetail() {
    onInteract?.()
    setDetailOpen(true)
  }

  const descTrimmed = product.description?.trim() ?? ''

  const effectivePrice = Number(product.promo_price ?? product.price)
  const installmentText =
    installmentsMaxNoInterest != null &&
    installmentsMaxNoInterest >= 1 &&
    effectivePrice > 0
      ? installmentLabel(installmentsMaxNoInterest, effectivePrice)
      : null

  return (
    <div className="group bg-surface border border-border rounded-[20px] overflow-hidden hover:-translate-y-1 hover:border-primary hover:shadow-[0_8px_40px_var(--primary-glow),0_0_0_1px_var(--primary-dim)] transition-all duration-300">

      {/* Image */}
      <button
        type="button"
        onClick={openDetail}
        title="Ver detalhes do produto"
        className="relative aspect-[3/4] w-full overflow-hidden bg-surface2 text-left border-0 p-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
      >
        {variant?.photos[0] ? (
          <img src={variant.photos[0]} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="relative w-full h-full flex flex-col items-center justify-center gap-2 px-3 bg-surface2 text-center">
            <span className="text-5xl sm:text-6xl" aria-hidden>👗</span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-primary/90 line-clamp-2 break-words">{cat}</span>
            {variant && (
              <span className="text-xs text-muted break-words max-w-full">{variant.color}</span>
            )}
            <span className="text-[10px] text-muted/80 mt-1">Toque para ver detalhes</span>
          </div>
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
      </button>

      {/* Info */}
      {layout === 'vitrine' ? (
        <button
          type="button"
          onClick={openDetail}
          className="w-full min-w-0 text-left p-2.5 sm:p-3 border-t border-border/60 hover:bg-surface2/80 transition-colors rounded-b-[20px]"
        >
          <span className="font-syne font-semibold text-sm text-foreground line-clamp-2 break-words mb-1.5 block">
            {product.name}
          </span>
          {product.variants_json.length > 1 && variant && (
            <span className="block text-[11px] text-muted line-clamp-1 break-words mb-1">
              {variant.color}
            </span>
          )}
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-1 min-w-0">
            <span className="text-accent font-bold text-sm tabular-nums shrink-0">
              R${effectivePrice.toFixed(2).replace('.', ',')}
            </span>
            {product.promo_price != null && (
              <span className="text-muted text-[11px] line-through tabular-nums">
                R${Number(product.price).toFixed(2).replace('.', ',')}
              </span>
            )}
          </div>
          {installmentText && (
            <p className="text-[11px] text-muted leading-snug break-words">
              {installmentText} <span className="text-muted/90">sem juros</span>
            </p>
          )}
          {!isSoldOut && isLowStock && (
            <p className="text-[10px] text-warm font-medium mt-1.5">Últimas unidades</p>
          )}
        </button>
      ) : (
        <div className="p-3.5">
          <button
            type="button"
            onClick={openDetail}
            className="font-syne font-semibold text-sm text-left w-full truncate mb-1.5 hover:text-primary transition-colors"
          >
            {product.name}
          </button>

          <p className="text-[10px] text-muted uppercase tracking-wide mb-1.5 truncate" title={cat}>
            {cat}
          </p>

          {!isSoldOut && (
            <p className="text-[11px] mb-2 leading-snug">
              {isLowStock ? (
                <span className="text-warm font-medium">Últimas unidades</span>
              ) : (
                <span className="text-accent/90">Disponível</span>
              )}
            </p>
          )}

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

          <div className="mb-2.5">
            <p className="text-[10px] text-muted uppercase tracking-wide mb-1.5">Cor</p>
            {product.variants_json.length > 1 ? (
              <div className="flex flex-wrap gap-2 items-center">
                {product.variants_json.map((v, i) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => { setSelectedVariantIdx(i); setSelectedSize(null); onInteract?.() }}
                    title={sumStock(v) > 0 ? v.color : `${v.color} — indisponível`}
                    className={`min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center rounded-full transition-all ${i === selectedVariantIdx ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface' : ''}`}
                  >
                    <span
                      className={`block w-6 h-6 rounded-full border-2 ${i === selectedVariantIdx ? 'border-primary scale-110' : 'border-border'}`}
                      style={{ background: v.colorHex }}
                    />
                  </button>
                ))}
              </div>
            ) : variant ? (
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-5 h-5 rounded-full border-2 border-primary shrink-0" style={{ background: variant.colorHex }} />
                <span className="text-xs text-foreground font-medium truncate">{variant.color}</span>
              </div>
            ) : null}
          </div>

          {!isSoldOut && (
            <div className="mb-3">
              <p className="text-[10px] text-muted uppercase tracking-wide mb-1.5">Tamanho</p>
              <div className="flex gap-1.5 flex-wrap">
                {allSizes.length > 0 ? allSizes.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => { setSelectedSize(s); onInteract?.() }}
                      title={s}
                      className={`min-h-[40px] min-w-[40px] px-2.5 rounded-lg border text-[11px] font-semibold transition-all ${
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
            </div>
          )}

          {isSoldOut ? (
            <div className="w-full py-2.5 text-center text-xs text-muted border border-border rounded-xl cursor-not-allowed">
              Produto esgotado
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleAdd()}
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
      )}

      {/* Detalhes: portal evita fixed preso ao ancestral com transform (animate-fade-up) */}
      {portalReady &&
        detailOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[175] flex items-end justify-center sm:items-center p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`produto-detalhe-${product.id}`}
          >
            <button
              type="button"
              aria-label="Fechar detalhes"
              className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
              onClick={() => setDetailOpen(false)}
            />
            <div className="relative z-[176] w-full max-w-[calc(100vw-16px)] sm:max-w-lg max-h-[min(92vh,calc(100dvh-32px))] rounded-t-3xl sm:rounded-3xl bg-surface border border-border shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden mb-[env(safe-area-inset-bottom,0px)] sm:mb-0">
              <div className="flex flex-shrink-0 items-center justify-between gap-3 px-4 pt-4 pb-2 border-b border-border min-w-0">
                <h2
                  id={`produto-detalhe-${product.id}`}
                  className="font-syne font-bold text-lg sm:text-xl text-foreground min-w-0 break-words pr-2"
                >
                  {product.name}
                </h2>
                <button
                  type="button"
                  onClick={() => setDetailOpen(false)}
                  className="flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-border text-muted hover:text-foreground hover:border-primary transition-colors"
                  aria-label="Fechar"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="overflow-y-auto px-4 pb-6 pt-3 flex-1 min-h-0">
                {variant?.photos?.length ? (
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 -mx-1 px-1 snap-x snap-mandatory">
                    {variant.photos.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt=""
                        className="h-48 w-36 flex-shrink-0 rounded-xl object-cover snap-center border border-border"
                      />
                    ))}
                  </div>
                ) : null}
                <p className="text-xs text-muted uppercase tracking-wide mb-1">{cat}</p>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-accent font-bold text-lg">
                    R${Number(product.promo_price ?? product.price).toFixed(2).replace('.', ',')}
                  </span>
                  {product.promo_price != null && (
                    <span className="text-muted text-sm line-through">
                      R${Number(product.price).toFixed(2).replace('.', ',')}
                    </span>
                  )}
                </div>
                {installmentText && (
                  <p className="text-xs text-muted mb-4">
                    {installmentText} sem juros
                  </p>
                )}
                <p className="text-sm font-medium mb-4">
                  {isSoldOut ? (
                    <span className="text-muted">Esgotado</span>
                  ) : allSizes.length === 0 ? (
                    <span className="text-warm">Indisponível nesta cor</span>
                  ) : isLowStock ? (
                    <span className="text-warm">Últimas unidades</span>
                  ) : (
                    <span className="text-accent">Disponível</span>
                  )}
                </p>
                <h3 className="font-syne font-semibold text-sm text-foreground mb-2">Descrição</h3>
                <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap break-words mb-5">
                  {descTrimmed || 'Sem descrição adicional.'}
                </p>

                {!isSoldOut && (
                  <>
                    <div className="mb-4">
                      <p className="text-[10px] text-muted uppercase tracking-wide mb-2">Cor</p>
                      {product.variants_json.length > 1 ? (
                        <div className="flex flex-wrap gap-2">
                          {product.variants_json.map((v, i) => (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => { setSelectedVariantIdx(i); setSelectedSize(null); onInteract?.() }}
                              title={sumStock(v) > 0 ? v.color : `${v.color} — indisponível`}
                              className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition-all ${i === selectedVariantIdx ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface' : ''}`}
                            >
                              <span
                                className={`block w-7 h-7 rounded-full border-2 ${i === selectedVariantIdx ? 'border-primary' : 'border-border'}`}
                                style={{ background: v.colorHex }}
                              />
                            </button>
                          ))}
                        </div>
                      ) : variant ? (
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full border-2 border-primary shrink-0" style={{ background: variant.colorHex }} />
                          <span className="text-sm text-foreground font-medium">{variant.color}</span>
                        </div>
                      ) : null}
                    </div>
                    <div className="mb-2">
                      <p className="text-[10px] text-muted uppercase tracking-wide mb-2">Tamanho</p>
                      <div className="flex flex-wrap gap-2">
                        {allSizes.length > 0 ? (
                          allSizes.map(s => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => { setSelectedSize(s); onInteract?.() }}
                              className={`min-h-[44px] min-w-[44px] px-3 rounded-xl border text-sm font-semibold transition-all ${
                                selectedSize === s
                                  ? 'bg-primary/20 border-primary text-primary'
                                  : 'bg-surface2 border-border text-muted hover:border-primary hover:text-primary'
                              }`}
                            >
                              {s}
                            </button>
                          ))
                        ) : (
                          <span className="text-xs text-muted">Sem tamanhos disponíveis nesta cor</span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
              {!isSoldOut && (
                <div className="flex-shrink-0 border-t border-border px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] bg-surface">
                  <button
                    type="button"
                    onClick={() => handleAdd(true)}
                    disabled={allSizes.length === 0}
                    className={`w-full min-h-[48px] py-3 rounded-xl text-sm font-semibold border transition-all ${
                      added
                        ? 'bg-accent/20 border-accent text-accent'
                        : 'bg-primary text-white border-primary hover:shadow-[0_4px_20px_var(--primary-glow)]'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {added ? '✓ Adicionado ao carrinho' : 'Adicionar ao carrinho'}
                  </button>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
