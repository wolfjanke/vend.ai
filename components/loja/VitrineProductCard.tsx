'use client'

import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
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

function discountPercent(price: number, promoPrice: number | null): number | null {
  if (promoPrice == null || promoPrice <= price) return null
  return Math.round(((Number(promoPrice) - price) / Number(promoPrice)) * 100)
}

function ColorSwatches({ variants }: { variants: ProductVariant[] }) {
  const colors = variants
    .map(v => v.colorHex?.trim())
    .filter((c): c is string => Boolean(c))
    .filter((c, i, a) => a.indexOf(c) === i)
    .slice(0, 6)

  if (colors.length === 0) return null

  return (
    <div className="produto-color-swatches" aria-hidden>
      {colors.map(hex => (
        <span
          key={hex}
          className="produto-color-swatch"
          style={{ backgroundColor: hex }}
        />
      ))}
    </div>
  )
}

function FavoriteButton() {
  return (
    <button
      type="button"
      className="produto-card-favorite"
      aria-label="Favoritar"
      onClick={e => e.stopPropagation()}
    >
      <Heart className="w-4 h-4" strokeWidth={2} />
    </button>
  )
}

function PriceBlock({
  effectivePrice,
  promoPrice,
  installmentText,
  className = '',
  inverted = false,
  reserveParcelaSpace = false,
}: {
  effectivePrice:  number
  promoPrice:      number | null
  installmentText: string | null
  className?:      string
  inverted?:       boolean
  reserveParcelaSpace?: boolean
}) {
  const priceCls = inverted ? 'text-white' : 'produto-preco font-bold tabular-nums shrink-0'
  const mutedCls = inverted ? 'text-white/70' : 'produto-preco-old tabular-nums'
  const parcelaCls = inverted ? 'text-white/70 produto-parcela' : 'produto-parcela text-muted'
  const showParcela = Boolean(installmentText) || reserveParcelaSpace
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
      {showParcela && (
        <p className={`break-words min-h-[1.125rem] leading-[var(--theme-lh-parcela)] ${parcelaCls}`}>
          {installmentText ?? '\u00A0'}
        </p>
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
  const isList = cardTheme.catalogLayout === 'list'
  const shadow = cardTheme.shadow
    ? 'shadow-lg hover:shadow-xl'
    : 'hover:shadow-[0_8px_40px_var(--primary-glow),0_0_0_1px_var(--primary-dim)]'
  const baseCard = `produto-card group overflow-hidden h-full flex flex-col min-h-0 ${shadow}`
  const vitrineTitleCls =
    'produto-nome font-semibold line-clamp-2 break-words block mb-1 min-h-[2.625rem]'
  const vitrineInfoBtnCls =
    'card-info-below w-full min-w-0 flex-1 flex flex-col text-left border-t border-border/60 hover:bg-surface2/80 transition-colors'
  const mediaBtnCls =
    'produto-card-media relative w-full shrink-0 overflow-hidden bg-surface2 text-left border-0 p-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset'
  const imgClsCover =
    'absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105'
  const imgClsStatic = 'absolute inset-0 w-full h-full object-cover'
  const discount = cardTheme.showDiscountBadge
    ? discountPercent(effectivePrice, product.promo_price)
    : null

  const overlayStyle = cardTheme.overlayGradient
    ? { background: cardTheme.overlayGradient }
    : undefined

  const imageBtn = (
    <button
      type="button"
      onClick={onOpenDetail}
      title="Ver detalhes do produto"
      className={mediaBtnCls}
      style={{ borderRadius: isList ? undefined : radius }}
    >
      <CardMedia
        photoUrl={photoUrl}
        product={product}
        variant={variant}
        imgClassName={imgClsCover}
      />
      {cardTheme.showFavoriteIcon && <FavoriteButton />}
      {discount != null && discount > 0 && (
        <span className="produto-discount-badge">-{discount}%</span>
      )}
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
          {cardTheme.showFavoriteIcon && <FavoriteButton />}
          <div
            className="card-info-overlay absolute inset-0 flex flex-col justify-end min-w-0"
            style={overlayStyle}
          >
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
        className={baseCard}
        style={{ borderRadius: radius }}
        data-shimmer={cardTheme.shimmer ? 'true' : 'false'}
      >
        <div className="relative w-full shrink-0 min-w-0">
          {product.promo_price != null && !cardTheme.showDiscountBadge && (
            <span className="absolute top-2 left-2 z-10 px-2 py-1 rounded-full bg-primary text-white produto-badge font-bold text-center">
              Promo
            </span>
          )}
          {imageBtn}
        </div>
        <button
          type="button"
          onClick={onOpenDetail}
          className={vitrineInfoBtnCls}
        >
          <span className={`${vitrineTitleCls} ${isList ? 'min-h-0' : ''}`}>{product.name}</span>
          <div className="mt-auto pt-0.5">
            <PriceBlock
              effectivePrice={effectivePrice}
              promoPrice={product.promo_price}
              installmentText={installmentText}
              reserveParcelaSpace
            />
          </div>
        </button>
      </div>
    )
  }

  if (cardTheme.infoPosition === 'sidebar') {
    const cardLayout = isList
      ? `${baseCard} flex flex-row items-stretch`
      : `${baseCard} flex flex-row`

    return (
      <div
        className={cardLayout}
        style={{ borderRadius: radius }}
        data-shimmer={cardTheme.shimmer ? 'true' : 'false'}
      >
        {!isList && (
          <div
            className="w-1.5 shrink-0"
            style={{ background: `linear-gradient(180deg, var(--primary), var(--accent))` }}
          />
        )}
        <div className={`flex ${isList ? 'flex-row flex-1 min-w-0' : 'flex-col flex-1 min-w-0'}`}>
          {imageBtn}
          <button
            type="button"
            onClick={onOpenDetail}
            className={`card-info-sidebar w-full min-w-0 flex-1 flex flex-col text-left p-2.5 sm:p-3 hover:bg-surface2/80 transition-colors`}
          >
            <span className={`produto-nome font-bold ${isList ? '' : 'uppercase tracking-wide'} line-clamp-2 break-words block mb-1 ${isList ? 'min-h-0' : 'min-h-[2.625rem]'}`}>
              {product.name}
            </span>
            <div className="mt-auto pt-0.5">
              <PriceBlock
                effectivePrice={effectivePrice}
                promoPrice={product.promo_price}
                installmentText={installmentText}
                reserveParcelaSpace
              />
            </div>
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
      className={baseCard}
      style={{ borderRadius: radius }}
      data-shimmer={cardTheme.shimmer ? 'true' : 'false'}
    >
      {imageBtn}
      <button
        type="button"
        onClick={onOpenDetail}
        className={`${vitrineInfoBtnCls} p-2.5 sm:p-3`}
      >
        <span className={`${vitrineTitleCls} mb-1.5`}>
          {product.name}
        </span>
        {cardTheme.showColorSwatches ? (
          <ColorSwatches variants={product.variants_json} />
        ) : (
          <span className="produto-variant-color text-muted line-clamp-1 break-words mb-1 min-h-[1.125rem] leading-tight">
            {variant?.color?.trim() ? variant.color : 'Cor única'}
          </span>
        )}
        <div className="mt-auto pt-0.5">
          <PriceBlock
            effectivePrice={effectivePrice}
            promoPrice={product.promo_price}
            installmentText={installmentText}
            reserveParcelaSpace
          />
        </div>
      </button>
    </div>
  )
}
