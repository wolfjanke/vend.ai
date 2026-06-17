import type { Product, StockAlertsConfig } from '@/types'

export const DEFAULT_STOCK_ALERTS: StockAlertsConfig = {
  enabled:   false,
  threshold: 3,
}

export function normalizeStockAlerts(raw?: Partial<StockAlertsConfig> | null): StockAlertsConfig {
  const rawThreshold = raw?.threshold
  const threshold = rawThreshold != null && Number.isFinite(Number(rawThreshold))
    ? Math.min(99, Math.max(1, Math.round(Number(rawThreshold))))
    : DEFAULT_STOCK_ALERTS.threshold
  return {
    enabled:   raw?.enabled ?? DEFAULT_STOCK_ALERTS.enabled,
    threshold,
  }
}

export type LowStockSku = {
  productId:     string
  productName:   string
  productSlug:   string
  variantId:     string
  variantLabel:  string
  skuKey:        string
  qty:           number
}

/** SKUs ativos com 1 ≤ qty ≤ threshold (produto ativo na vitrine). */
export function getLowStockSkus(products: Product[], config: StockAlertsConfig): LowStockSku[] {
  if (!config.enabled) return []

  const { threshold } = config
  const results: LowStockSku[] = []

  for (const p of products) {
    if (!p.active) continue
    for (const v of p.variants_json ?? []) {
      for (const [skuKey, qtyRaw] of Object.entries(v.stock ?? {})) {
        const qty = Number(qtyRaw) || 0
        if (qty >= 1 && qty <= threshold) {
          results.push({
            productId:    p.id,
            productName:  p.name,
            productSlug:  p.slug,
            variantId:    v.id,
            variantLabel: v.color,
            skuKey,
            qty,
          })
        }
      }
    }
  }

  return results.sort(
    (a, b) => a.qty - b.qty || a.productName.localeCompare(b.productName, 'pt-BR'),
  )
}

/** Menor qty em alerta para um produto (null = sem alerta de baixo). */
export function productLowStockMinQty(p: Product, threshold: number): number | null {
  if (!p.active) return null
  let minQty: number | null = null
  for (const v of p.variants_json ?? []) {
    for (const qtyRaw of Object.values(v.stock ?? {})) {
      const qty = Number(qtyRaw) || 0
      if (qty >= 1 && qty <= threshold) {
        if (minQty === null || qty < minQty) minQty = qty
      }
    }
  }
  return minQty
}
