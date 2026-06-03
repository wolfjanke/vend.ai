'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { Product, CartItem, CustomCategory } from '@/types'
import { getCategoryDisplayLabel } from '@/types'
import type { StoreThemeConfig } from '@/lib/themes'
import { getTheme, themeToCardConfig } from '@/lib/themes'
import { getVariantPhotoUrl } from '@/lib/product-media'
import ProductPlaceholder from './ProductPlaceholder'
import VitrineProductCard from './VitrineProductCard'

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
  onProductFocus?: (product: Product) => void
  /** Vitrine: só imagem + nome/preço/parcelas; cor, tamanho e compra no modal. */
  layout?:     'vitrine' | 'default'
  cardTheme?:  StoreThemeConfig
  storeSlug?:  string
  installmentsMaxNoInterest?: number | null
  customCategories?: CustomCategory[]
}

export default function ProdutoCard({
  product,
  displayVariantIndex,
  onAddToCart,
  onInteract,
  onProductFocus,
  layout = 'default',
  cardTheme: cardThemeProp,
  storeSlug,
  installmentsMaxNoInterest = null,
  customCategories = [],
}: Props) {
  const cardTheme =
    cardThemeProp ??
    themeToCardConfig(getTheme('default'), false)
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(() =>
    displayVariantIndex ??
      (layout === 'vitrine' ? firstVariantIndexWithStock(product) : 0)
  )
  const [selectedSize,       setSelectedSize]       = useState<string | null>(null)
  const [added,              setAdded]              = useState(false)
  const [detailOpen,         setDetailOpen]         = useState(false)
  const [portalReady,        setPortalReady]        = useState(false)
  const [portalTarget,       setPortalTarget]       = useState<HTMLElement | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPortalTarget(document.getElementById('store-theme-root'))
    setPortalReady(true)
  }, [])

  useEffect(() => {
    if (layout !== 'vitrine' || !onProductFocus) return
    const el = cardRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) onProductFocus(product)
      },
      { threshold: 0.6 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [layout, onProductFocus, product])

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
  const variantPhotoUrl = getVariantPhotoUrl(variant)
  const allSizes = variant
    ? Object.entries(variant.stock).filter(([, q]) => Number(q) > 0).map(([s]) => s)
    : []

  const variantTotalStock = variant
    ? Object.values(variant.stock).reduce((a, b) => Number(a) + Number(b), 0)
    : 0
  const isSoldOut =
    !variant || Object.values(variant.stock).every(q => Number(q) === 0)
  const isLowStock = variantTotalStock > 0 && variantTotalStock <= 3
  const cat = getCategoryDisplayLabel(product.category, customCategories)

  // O botão fica habilitado somente quando cor e tamanho estão escolhidos.
  // Se só há uma cor, ela já está auto-selecionada via selectedVariantIdx.
  // Se só há um tamanho, ele é considerado implicitamente selecionado.
  const effectiveSize = selectedSize ?? (allSizes.length === 1 ? allSizes[0] : null)
  const canAdd = !isSoldOut && !!variant && !!effectiveSize

  function handleAdd(closeDetail?: boolean) {
    const size = effectiveSize
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
      photo:      variantPhotoUrl ?? undefined,
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

  const detailModal =
    portalReady &&
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
          className="absolute inset-0 backdrop-blur-sm"
          style={{ backgroundColor: 'color-mix(in srgb, var(--theme-bg) 82%, transparent)' }}
          onClick={() => setDetailOpen(false)}
        />
        <div
          className="relative z-[176] w-full max-w-[calc(100vw-16px)] sm:max-w-lg max-h-[min(92vh,calc(100dvh-32px))] shadow-[0_20px_60px_rgba(0,0,0,0.35)] flex flex-col overflow-hidden mb-[env(safe-area-inset-bottom,0px)] sm:mb-0"
          style={{
            background:   'var(--theme-card-bg)',
            color:        'var(--theme-text)',
            border:       '1px solid var(--theme-card-border)',
            borderRadius: 'var(--theme-card-radius)',
          }}
        >
          <div
            className="flex flex-shrink-0 items-center justify-between gap-3 px-4 pt-4 pb-2 min-w-0"
            style={{ borderBottom: '1px solid var(--theme-card-border)' }}
          >
            <h2
              id={`produto-detalhe-${product.id}`}
              className="font-semibold text-lg sm:text-xl min-w-0 break-words pr-2"
              style={{
                fontFamily: 'var(--theme-font-display)',
                fontWeight: 'var(--theme-font-weight-display)',
                color:      'var(--theme-text)',
              }}
            >
              {product.name}
            </h2>
            <button
              type="button"
              onClick={() => setDetailOpen(false)}
              className="flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors"
              style={{
                border:     '1px solid var(--theme-card-border)',
                color:      'var(--theme-text-muted)',
                background: 'transparent',
              }}
              aria-label="Fechar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="overflow-y-auto px-4 pb-6 pt-3 flex-1 min-h-0">
            {variantPhotoUrl ? (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 -mx-1 px-1 snap-x snap-mandatory">
                {(variant?.photos ?? []).filter(Boolean).map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className="h-48 w-36 flex-shrink-0 object-cover snap-center"
                    style={{
                      borderRadius: 'calc(var(--theme-card-radius) * 0.75)',
                      border:       '1px solid var(--theme-card-border)',
                    }}
                  />
                ))}
              </div>
            ) : (
              <div
                className="w-full h-44 overflow-hidden mb-3"
                style={{
                  borderRadius: 'var(--theme-card-radius)',
                  border:       '1px solid var(--theme-card-border)',
                  background:   'var(--theme-surface)',
                }}
              >
                <ProductPlaceholder
                  category={product.category}
                  colorHex={variant?.colorHex}
                  className="w-full h-full"
                />
              </div>
            )}
            <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--theme-text-muted)' }}>{cat}</p>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-bold text-lg" style={{ color: 'var(--theme-price)' }}>
                R${Number(product.promo_price ?? product.price).toFixed(2).replace('.', ',')}
              </span>
              {product.promo_price != null && (
                <span className="text-sm line-through" style={{ color: 'var(--theme-price-old)' }}>
                  R${Number(product.price).toFixed(2).replace('.', ',')}
                </span>
              )}
            </div>
            {installmentText && (
              <p className="text-xs mb-4" style={{ color: 'var(--theme-text-muted)' }}>
                {installmentText} sem juros
              </p>
            )}
            <p className="text-sm font-medium mb-4">
              {isSoldOut ? (
                <span style={{ color: 'var(--theme-text-muted)' }}>Esgotado</span>
              ) : allSizes.length === 0 ? (
                <span className="text-warm">Indisponível nesta cor</span>
              ) : isLowStock ? (
                <span className="text-warm">Últimas unidades</span>
              ) : (
                <span style={{ color: 'var(--theme-accent)' }}>Disponível</span>
              )}
            </p>
            <h3
              className="font-semibold text-sm mb-2"
              style={{
                fontFamily: 'var(--theme-font-display)',
                color:      'var(--theme-text)',
              }}
            >
              Descrição
            </h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words mb-3" style={{ color: 'var(--theme-text-muted)' }}>
              {descTrimmed || 'Sem descrição adicional.'}
            </p>
            {storeSlug && product.slug && (
              <a
                href={`/${storeSlug}/produto/${product.slug}`}
                className="inline-block text-sm font-medium mb-5 min-h-[44px] leading-[44px]"
                style={{ color: 'var(--theme-primary)' }}
              >
                Ver página do produto →
              </a>
            )}

            {!isSoldOut && (
              <>
                <div className="mb-4">
                  <p className="text-[10px] uppercase tracking-wide mb-2" style={{ color: 'var(--theme-text-muted)' }}>Cor</p>
                  {product.variants_json.length > 1 ? (
                    <div className="flex flex-wrap gap-2">
                      {product.variants_json.map((v, i) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => { setSelectedVariantIdx(i); setSelectedSize(null); onInteract?.() }}
                          title={sumStock(v) > 0 ? v.color : `${v.color} — indisponível`}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition-all"
                          style={
                            i === selectedVariantIdx
                              ? { boxShadow: '0 0 0 2px var(--theme-primary)' }
                              : undefined
                          }
                        >
                          <span
                            className="block w-7 h-7 rounded-full border-2"
                            style={{
                              background:  v.colorHex,
                              borderColor: i === selectedVariantIdx ? 'var(--theme-primary)' : 'var(--theme-card-border)',
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  ) : variant ? (
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full border-2 shrink-0" style={{ background: variant.colorHex, borderColor: 'var(--theme-primary)' }} />
                      <span className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>{variant.color}</span>
                    </div>
                  ) : null}
                </div>
                <div className="mb-2">
                  <p className="text-[10px] uppercase tracking-wide mb-2" style={{ color: 'var(--theme-text-muted)' }}>Tamanho</p>
                  <div className="flex flex-wrap gap-2">
                    {allSizes.length > 0 ? (
                      allSizes.map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => { setSelectedSize(s); onInteract?.() }}
                          className="min-h-[44px] min-w-[44px] px-3 rounded-xl border text-sm font-semibold transition-all"
                          style={
                            selectedSize === s
                              ? {
                                  background:   'var(--theme-primary-surface)',
                                  borderColor:  'var(--theme-primary-border)',
                                  color:        'var(--theme-primary)',
                                }
                              : {
                                  background:  'var(--theme-surface)',
                                  borderColor: 'var(--theme-card-border)',
                                  color:       'var(--theme-text-muted)',
                                }
                          }
                        >
                          {s}
                        </button>
                      ))
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Sem tamanhos disponíveis nesta cor</span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          {!isSoldOut && (
            <div
              className="flex-shrink-0 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
              style={{
                borderTop:    '1px solid var(--theme-card-border)',
                background:   'var(--theme-card-bg)',
              }}
            >
              {!canAdd && !added && (
                <p className="text-center text-xs mb-2" style={{ color: 'var(--theme-text-muted)' }}>
                  {!variant
                    ? 'Escolha uma cor para continuar'
                    : 'Escolha um tamanho para continuar'}
                </p>
              )}
              <button
                type="button"
                onClick={() => handleAdd(true)}
                disabled={!canAdd}
                className={`w-full min-h-[48px] py-3 rounded-xl text-sm font-semibold border transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                style={
                  added
                    ? {
                        background:  'color-mix(in srgb, var(--theme-accent) 20%, transparent)',
                        borderColor: 'var(--theme-accent)',
                        color:       'var(--theme-accent)',
                      }
                    : {
                        background:  'var(--theme-btn-bg)',
                        borderColor: 'var(--theme-btn-bg)',
                        color:       'var(--theme-btn-text)',
                      }
                }
              >
                {added ? '✓ Adicionado ao carrinho' : 'Adicionar ao carrinho'}
              </button>
            </div>
          )}
        </div>
      </div>,
      portalTarget ?? document.body,
    )

  if (layout === 'vitrine') {
    return (
      <div ref={cardRef} className="h-full min-w-0">
        <VitrineProductCard
          product={product}
          variant={variant}
          effectivePrice={effectivePrice}
          installmentText={installmentText}
          isSoldOut={isSoldOut}
          isLowStock={isLowStock}
          cardTheme={cardTheme}
          onOpenDetail={openDetail}
        />
        {detailModal}
      </div>
    )
  }

  return (
    <div ref={cardRef} className="group bg-surface border border-border rounded-[20px] overflow-hidden hover:-translate-y-1 hover:border-primary hover:shadow-[0_8px_40px_var(--primary-glow),0_0_0_1px_var(--primary-dim)] transition-all duration-300 h-full flex flex-col min-h-0">

      {/* Image — caixa fixa 3:4; imagem preenche com crop uniforme */}
      <button
        type="button"
        onClick={openDetail}
        title="Ver detalhes do produto"
        className="relative aspect-[3/4] w-full shrink-0 overflow-hidden bg-surface2 text-left border-0 p-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
      >
        {variantPhotoUrl ? (
          <img
            src={variantPhotoUrl}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0">
            <ProductPlaceholder
              category={product.category}
              colorHex={variant?.colorHex}
              className="w-full h-full"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-bg/80 to-transparent pt-6 pb-2 px-2 text-center pointer-events-none">
              {variant && (
                <span className="text-[10px] text-muted/90 break-words block">{variant.color}</span>
              )}
              <span className="text-[9px] text-muted/60 block mt-0.5">Toque para ver detalhes</span>
            </div>
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
              disabled={!canAdd}
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

      {detailModal}
    </div>
  )
}
