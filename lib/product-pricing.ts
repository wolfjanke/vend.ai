import type { Product, ProductVariant } from '@/types'

function roundPrice(n: number): number {
  return Math.max(0, Number(n.toFixed(2)))
}

/**
 * Preço unitário de um SKU (variant + chave de stock).
 * Ordem: stockPromoPrices → stockPrices → product.promo_price → product.price
 */
export function resolveSkuUnitPrice(
  product: Product,
  variant: ProductVariant,
  size: string,
): number {
  const key = String(size ?? '').trim()
  const promoSku = variant.stockPromoPrices?.[key]
  if (promoSku != null && Number(promoSku) > 0) {
    return roundPrice(Number(promoSku))
  }
  const priceSku = variant.stockPrices?.[key]
  if (priceSku != null && Number(priceSku) > 0) {
    return roundPrice(Number(priceSku))
  }
  if (product.promo_price != null) {
    return roundPrice(Number(product.promo_price))
  }
  return roundPrice(Number(product.price))
}

/** Menor preço disponível entre SKUs com estoque (para card "De R$ X"). */
export function resolveProductDisplayPriceRange(product: Product): {
  min: number
  max: number
  hasSkuPrices: boolean
} {
  let min = Number.POSITIVE_INFINITY
  let max = 0
  let hasSkuPrices = false

  for (const v of product.variants_json ?? []) {
    for (const [size, qty] of Object.entries(v.stock ?? {})) {
      if (Number(qty) <= 0) continue
      const p = resolveSkuUnitPrice(product, v, size)
      hasSkuPrices =
        hasSkuPrices ||
        (v.stockPrices?.[size] != null && Number(v.stockPrices[size]) > 0) ||
        (v.stockPromoPrices?.[size] != null && Number(v.stockPromoPrices[size]) > 0)
      if (p < min) min = p
      if (p > max) max = p
    }
  }

  if (min === Number.POSITIVE_INFINITY) {
    const fallback = roundPrice(
      product.promo_price != null ? Number(product.promo_price) : Number(product.price),
    )
    return { min: fallback, max: fallback, hasSkuPrices: false }
  }

  return { min: roundPrice(min), max: roundPrice(max), hasSkuPrices }
}
