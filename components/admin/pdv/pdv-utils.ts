import type { Product, ProductVariant } from '@/types'
import { getVariantPhotoUrl } from '@/lib/product-media'

export function formatPdvCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function stockKeysWithQty(v: ProductVariant): string[] {
  return Object.entries(v.stock ?? {})
    .filter(([, q]) => Number(q) > 0)
    .map(([k]) => k)
}

export function getProductThumbUrl(product: Product): string | null {
  for (const v of product.variants_json ?? []) {
    const url = getVariantPhotoUrl(v)
    if (url) return url
  }
  return null
}

export function getVariantThumbUrl(variant: ProductVariant | undefined | null): string | null {
  return getVariantPhotoUrl(variant)
}
