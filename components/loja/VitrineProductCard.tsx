'use client'

import { useEffect, useState } from 'react'
import type { Product, ProductVariant } from '@/types'
import type { StoreThemeConfig } from '@/lib/themes'
import { getVariantPhotoUrl } from '@/lib/product-media'
import ProductPlaceholder from './ProductPlaceholder'

type Props = {
  product:          Product
  variant:          ProductVariant | undefined
  effectivePrice:   number
  installmentText:  string | null
  isSoldOut:        boolean
  isLowStock:       boolean
  cardTheme:        StoreThemeConfig
  onOpenDetail:     () => void
}

function PriceBlock({
  effectivePrice,
  promoPrice,
  installmentText,
  className = '',
  inverted = false,
}: {
  effectivePrice:  number
  promoPrice:      number | null
  installmentText: string | null
  className?:      string
  inverted?:       boolean
}) {
  const priceCls = inverted ? 'text-white' : 'produto-preco font-bold tabular-nums shrink-0'
  const mutedCls = inverted ? 'text-white/70' : 'produto-preco-old tabular-nums'
  const parcelaCls = inverted ? 'text-white/70' : 'produto-preco-old produto-parcela'
  return (
    <div className={`flex flex-col gap-0.5 min-w-0 ${className}`}>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 min-w-0">
        <span className={priceCls}>
          R${effectivePrice.toFixed(2).replace('.', ',')}
        </span>
        {promoPrice != null && (
          <span className={`line-through tabular-nums ${mutedCls}`}>
            R${Number(promoPrice).toFixed(2).replace('.', ',')}
          </span>
        )}
      </div>
      {installmentText && (
        <p className={`break-words ${parcelaCls}`}>{installmentText}</p>
      )}
    </div>
  )
}

function CardMedia({
  photoUrl,
  product,
  variant,
  imgClassName,
}: {
  photoUrl:     string | null
  product:      Product
  variant:      ProductVariant | undefined
  imgClassName: string
}) {
  const [imgFailed, setImgFailed] = useState(false)

  useEffect(() => {
    setImgFailed(false)
  }, [photoUrl])

  const showPhoto = Boolean(photoUrl) && !imgFailed

  if (showPhoto) {
    return (
      <img
        src={photoUrl!}
        alt={product.name}
        className={imgClassName}
        onError={() => setImgFailed(true)}
      />
    )
  }

  return (
    <div className="absolute inset-0">
      <ProductPlaceholder
        category={product.category}
        colorHex={variant?.colorHex}
        className="w-full h-full"
      />
    </div>
  )
}

export default function VitrineProductCard({
  product,
  variant,
  effectivePrice,
  installmentText,
  isSoldOut,
  isLowStock,
  cardTheme,
  onOpenDetail,
}: Props) {
  const photoUrl = getVariantPhotoUrl(variant)
  const radius = cardTheme.borderRadius
  const shadow = cardTheme.shadow
    ? 'shadow-lg hover:shadow-xl'
    : 'hover:shadow-[0_8px_40px_var(--primary-glow),0_0_0_1px_var(--primary-dim)]'
  const baseCard = `produto-card group overflow-hidden h-full flex min-h-0 ${shadow}`
  const mediaBtnCls =
    'produto-card-media relative w-full shrink-0 overflow-hidden bg-surface2 text-left border-0 p-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset'
  const imgClsCover =
    'absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105'
  const imgClsStatic = 'absolute inset-0 w-full h-full object-cover'

  const imageBtn = (
    <button
      type="button"
      onClick={onOpenDetail}
      title="Ver detalhes do produto"
      className={mediaBtnCls}
      style={{ borderRadius: radius }}
    >
      <CardMedia
        photoUrl={photoUrl}
        product={product}
        variant={variant}
        imgClassName={imgClsCover}
      />
      {isSoldOut && (
        <>
          <div className="absolute inset-0 bg-bg/70" />
          <div className="absolute inset-0 flex items-center justify-center font-syne font-bold text-muted tracking-[2px] uppercase text-sm">
            ESGOTADO
          </div>
        </>
      )}
      {!isSoldOut && isLowStock && cardTheme.infoPosition !== 'badge' && (
        <span className="absolute top-2.5 left-2.5 px-2.5 py-1 bg-warm/20 border border-warm/20 rounded-lg text-warm text-[11px] font-bold uppercase tracking-wide">
          Últimas unidades
        </span>
      )}
      {product.promo_price && !isSoldOut && cardTheme.infoPosition === 'below' && (
        <span className="absolute top-2.5 left-2.5 px-2.5 py-1 bg-primary/20 border border-primary/30 rounded-lg text-primary text-[11px] font-bold uppercase tracking-wide">
          Promoção
        </span>
      )}
    </button>
  )

  if (cardTheme.infoPosition === 'overlay') {
    return (
      <div
        className={baseCard}
        style={{ borderRadius: radius }}
        data-shimmer={cardTheme.shimmer ? 'true' : 'false'}
      >
        <button
          type="button"
          onClick={onOpenDetail}
          className={`${mediaBtnCls} block`}
          style={{ borderRadius: radius }}
        >
          <CardMedia
            photoUrl={photoUrl}
            product={product}
            variant={variant}
            imgClassName={imgClsStatic}
          />
          <div className="card-info-overlay absolute inset-0 flex flex-col justify-end min-w-0">
            <span className="produto-nome font-semibold line-clamp-2 break-words mb-1">
              {product.name}
            </span>
            <PriceBlock
              effectivePrice={effectivePrice}
              promoPrice={product.promo_price}
              installmentText={installmentText}
              inverted
            />
          </div>
        </button>
      </div>
    )
  }

  if (cardTheme.infoPosition === 'badge') {
    return (
      <div
        className={`${baseCard} flex flex-col`}
        style={{ borderRadius: radius }}
        data-shimmer={cardTheme.shimmer ? 'true' : 'false'}
      >
        <div className="relative w-full shrink-0 min-w-0">
          <span className="absolute top-2 left-2 right-2 z-10 px-2 py-1 rounded-full bg-primary text-white produto-badge font-bold text-center truncate">
            {product.promo_price ? 'Promo' : product.name}
          </span>
          {imageBtn}
        </div>
        <button
          type="button"
          onClick={onOpenDetail}
          className="card-info-below w-full min-w-0 shrink-0 text-left border-t border-border/60 hover:bg-surface2/80 transition-colors"
        >
          <span className="produto-nome font-semibold line-clamp-2 break-words block mb-1">{product.name}</span>
          <PriceBlock effectivePrice={effectivePrice} promoPrice={product.promo_price} installmentText={installmentText} />
        </button>
      </div>
    )
  }

  if (cardTheme.infoPosition === 'sidebar') {
    return (
      <div
        className={`${baseCard} flex flex-row`}
        style={{ borderRadius: radius }}
        data-shimmer={cardTheme.shimmer ? 'true' : 'false'}
      >
        <div
          className="w-1.5 shrink-0"
          style={{ background: `linear-gradient(180deg, var(--primary), var(--accent))` }}
        />
        <div className="flex flex-col flex-1 min-w-0">
          {imageBtn}
          <button
            type="button"
            onClick={onOpenDetail}
            className="card-info-sidebar w-full min-w-0 p-2.5 text-left border-t border-border/60"
          >
            <span className="produto-nome font-bold uppercase tracking-wide line-clamp-1 break-words">{product.name}</span>
            <PriceBlock effectivePrice={effectivePrice} promoPrice={product.promo_price} installmentText={installmentText} />
          </button>
        </div>
      </div>
    )
  }

  if (cardTheme.infoPosition === 'hover') {
    return (
      <div
        className={baseCard}
        style={{ borderRadius: radius }}
        data-shimmer={cardTheme.shimmer ? 'true' : 'false'}
      >
        <div className="relative w-full shrink-0 min-w-0">
          {imageBtn}
          <button
            type="button"
            onClick={onOpenDetail}
            className="card-info-hover text-left border-0 cursor-pointer min-w-0"
            style={{ borderRadius: radius }}
          >
            <div className="min-w-0">
              <span className="produto-nome font-semibold line-clamp-2 break-words block mb-1">{product.name}</span>
              <PriceBlock effectivePrice={effectivePrice} promoPrice={product.promo_price} installmentText={installmentText} />
            </div>
          </button>
        </div>
      </div>
    )
  }

  // below (default)
  return (
    <div
      className={`${baseCard} flex flex-col`}
      style={{ borderRadius: radius }}
      data-shimmer={cardTheme.shimmer ? 'true' : 'false'}
    >
      {imageBtn}
      <button
        type="button"
        onClick={onOpenDetail}
        className="card-info-below w-full min-w-0 flex-1 flex flex-col min-h-0 text-left p-2.5 sm:p-3 border-t border-border/60 hover:bg-surface2/80 transition-colors"
      >
        <span className="produto-nome font-semibold line-clamp-2 break-words mb-1.5 block min-h-[2.625rem]">
          {product.name}
        </span>
        <span className="produto-variant-color text-muted line-clamp-1 break-words mb-1 min-h-[1.125rem] leading-tight">
          {variant?.color?.trim() ? variant.color : 'Cor única'}
        </span>
        <div className="mt-auto pt-0.5">
          <PriceBlock effectivePrice={effectivePrice} promoPrice={product.promo_price} installmentText={installmentText} />
        </div>
      </button>
    </div>
  )
}
