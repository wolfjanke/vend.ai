'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Product } from '@/types'
import { getCategoryDisplayLabel, availableStockKeys } from '@/types'
import ProductPlaceholder from '@/components/loja/ProductPlaceholder'
import { useLoja } from '@/components/loja/LojaContext'
import { findSimilarInStock, soldOutMessage } from '@/lib/vi-triggers'
import { vitrineText } from '@/lib/strip-emoji'
import { isPaidViPlan } from '@/lib/plans'
import { getCatalogAxes, getAxisLabels, shouldShowPrimarySelector, shouldShowSecondarySelector } from '@/lib/catalog-axes'
import { resolveSkuUnitPrice, resolveProductDisplayPriceRange } from '@/lib/product-pricing'

interface Props {
  product: Product
}

export default function ProductDetailClient({ product }: Props) {
  const { store, products, addToCart, setCartOpen, openViWithMessage, onProductFocus, plan, baseUrl } = useLoja()
  const [variantIdx, setVariantIdx] = useState(0)
  const [size, setSize] = useState<string | null>(null)
  const [photoIdx, setPhotoIdx] = useState(0)

  const catalogAxes = getCatalogAxes(product)
  const axisLabels = getAxisLabels(catalogAxes)
  const variant = product.variants_json[variantIdx]
  const allSizes = variant
    ? availableStockKeys(variant.stock, { stockAxis: catalogAxes.stockAxis })
    : []
  const isSoldOut = !variant || Object.values(variant.stock).every(q => Number(q) === 0)
  const effectiveSize = size ?? (allSizes.length === 1 ? allSizes[0] : null)
  const priceRange = resolveProductDisplayPriceRange(product)
  const price = effectiveSize && variant
    ? resolveSkuUnitPrice(product, variant, effectiveSize)
    : priceRange.min
  const showPrimary = shouldShowPrimarySelector(product)
  const showSecondary = shouldShowSecondarySelector(product) && allSizes.length > 0
  const catLabel = vitrineText(getCategoryDisplayLabel(product.category, store.settings_json?.customCategories ?? []))
  const displayName = vitrineText(product.name)
  const displayDescription = vitrineText(product.description ?? '')

  const photos = variant?.photos?.filter(Boolean) ?? []

  useEffect(() => {
    setVariantIdx(0)
    setSize(null)
    setPhotoIdx(0)
    onProductFocus(product)
  }, [product, onProductFocus])

  useEffect(() => {
    if (!isSoldOut || !isPaidViPlan(plan)) return
    const alt = findSimilarInStock(products, product.category, product.id, baseUrl, store.slug)
    const slug = product.slug?.trim() || product.id
    openViWithMessage(
      soldOutMessage(product.name, alt, store.assistant_tone ?? 'friendly'),
    )
  }, [product.id, isSoldOut, plan, products, product.category, product.name, product.slug, baseUrl, store.slug, store.assistant_tone, openViWithMessage])

  const canAdd = !isSoldOut && !!variant && !!effectiveSize

  function handleAdd() {
    if (!canAdd || !variant) return
    addToCart({
      product_id: product.id,
      variant_id: variant.id,
      name:       displayName,
      size:       effectiveSize!,
      color:      variant.color,
      qty:        1,
      price,
      photo:      variant.photos[0],
      description: product.description?.trim() || undefined,
    })
    setCartOpen(true)
  }

  return (
    <div className="px-4 md:px-6 py-4 pb-32 max-w-3xl mx-auto min-w-0">
      <nav className="text-xs text-muted mb-4 flex flex-wrap items-center gap-1 break-words">
        <Link href={`/${store.slug}`} className="hover:text-primary">{vitrineText(store.name)}</Link>
        <span>/</span>
        <span>{catLabel}</span>
      </nav>

      <Link
        href={`/${store.slug}`}
        className="inline-flex items-center text-sm text-primary mb-4 min-h-[44px]"
      >
        ← Voltar ao catálogo
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0">
        <div className="min-w-0">
          <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-surface2 border border-border">
            {photos[photoIdx] ? (
              <img src={photos[photoIdx]} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <ProductPlaceholder
                category={product.category}
                colorHex={variant?.colorHex}
                className="w-full h-full"
              />
            )}
          </div>
          {photos.length > 1 && (
            <div className="flex gap-2 mt-2 overflow-x-auto scrollbar-hide pb-1">
              {photos.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPhotoIdx(i)}
                  className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 min-h-[44px] ${
                    i === photoIdx ? 'border-primary' : 'border-border'
                  }`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="min-w-0 flex flex-col">
          <h1 className="font-syne font-bold text-xl sm:text-2xl mb-2 break-words">{displayName}</h1>
          <p className="text-xs text-muted uppercase tracking-wide mb-3">{catLabel}</p>
          <div className="flex flex-wrap items-baseline gap-2 mb-4">
            <span className="produto-preco font-bold text-2xl tabular-nums">
              {priceRange.hasSkuPrices && !effectiveSize && priceRange.min !== priceRange.max
                ? `De R$${priceRange.min.toFixed(2).replace('.', ',')}`
                : `R$${price.toFixed(2).replace('.', ',')}`}
            </span>
            {product.promo_price != null && !priceRange.hasSkuPrices && (
              <span className="text-muted line-through text-sm tabular-nums">
                R${Number(product.price).toFixed(2).replace('.', ',')}
              </span>
            )}
          </div>
          {displayDescription && (
            <p className="text-sm text-muted leading-relaxed mb-4 break-words whitespace-pre-wrap">
              {displayDescription}
            </p>
          )}

          {!isSoldOut && showPrimary && (
            <div className="mb-4">
              <p className="text-[10px] text-muted uppercase mb-2">{axisLabels.primary}</p>
              <div className="flex flex-wrap gap-2">
                {product.variants_json.map((v, i) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => { setVariantIdx(i); setSize(null); setPhotoIdx(0) }}
                    className={`min-h-[44px] min-w-[44px] rounded-full border-2 ${
                      i === variantIdx ? 'border-primary ring-2 ring-primary/30' : 'border-border'
                    }`}
                    style={{ background: v.colorHex }}
                    title={v.color}
                  />
                ))}
              </div>
            </div>
          )}

          {!isSoldOut && showSecondary && (
            <div className="mb-6">
              <p className="text-[10px] text-muted uppercase mb-2">{axisLabels.secondary}</p>
              <div className="flex flex-wrap gap-2">
                {allSizes.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={`min-h-[44px] min-w-[44px] px-3 rounded-xl border text-sm font-semibold ${
                      effectiveSize === s
                        ? 'bg-primary/20 border-primary text-primary'
                        : 'border-border text-muted'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isSoldOut ? (
            <p className="text-warm font-medium mb-4">Produto esgotado</p>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              disabled={!canAdd}
              className="w-full min-h-[48px] rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-50 mb-3"
            >
              Adicionar ao carrinho
            </button>
          )}

          <a
            href={`https://wa.me/${store.whatsapp}?text=${encodeURIComponent(`Olá! Tenho interesse no ${product.name}`)}`}
            target="_blank"
            rel="noreferrer"
            className="w-full min-h-[44px] flex items-center justify-center rounded-xl border border-accent text-accent text-sm font-medium"
          >
            Falar com vendedor
          </a>
        </div>
      </div>
    </div>
  )
}
