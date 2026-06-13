'use client'

import type { Product } from '@/types'
import ProductPlaceholder from '@/components/loja/ProductPlaceholder'
import { getProductThumbUrl, getVariantThumbUrl } from './pdv-utils'
import type { ProductVariant } from '@/types'

interface Props {
  product:  Product
  variant?: ProductVariant | null
  className?: string
}

export default function PdvProductThumb({ product, variant, className = 'w-12 h-12 rounded-lg shrink-0 overflow-hidden border border-border' }: Props) {
  const url = variant ? getVariantThumbUrl(variant) : getProductThumbUrl(product)

  if (url) {
    return (
      <img
        src={url}
        alt=""
        className={`${className} object-cover`}
      />
    )
  }

  const firstVariant = variant ?? product.variants_json?.[0]
  return (
    <div className={className}>
      <ProductPlaceholder
        category={product.category ?? 'outro'}
        colorHex={firstVariant?.colorHex}
        className="w-full h-full"
      />
    </div>
  )
}
