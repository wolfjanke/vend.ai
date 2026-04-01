import type { Product, ProductVariant, ProductVariantDisplay } from '@/types'

/** Chave estável para não repetir a mesma variação (dados duplicados em `variants_json`). */
function dedupeKeyForVariant(v: ProductVariant): string {
  const id = v.id?.trim()
  if (id) return `id:${id}`
  const color = (v.color ?? '').trim().toLowerCase()
  const hex = (v.colorHex ?? '').trim().toLowerCase()
  return `sig:${color}|${hex}`
}

/** Expande cada produto em N itens (um por variação distinta) para a vitrine. */
export function expandProductsByVariant(products: Product[]): ProductVariantDisplay[] {
  const out: ProductVariantDisplay[] = []
  for (const p of products) {
    if (p.active === false) continue
    const vars = p.variants_json
    if (!vars?.length) continue
    const seen = new Set<string>()
    for (let i = 0; i < vars.length; i++) {
      const key = dedupeKeyForVariant(vars[i])
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ product: p, variantIndex: i })
    }
  }
  return out
}
