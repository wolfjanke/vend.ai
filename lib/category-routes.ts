import type { CustomCategory, Product } from '@/types'
import { PRODUCT_CATEGORY_SLUGS } from '@/types'

/** Categoria válida para página dedicada (existe e tem produto ativo). */
export function isValidStoreCategory(
  category: string,
  products: Product[],
  customCategories: CustomCategory[] = [],
): boolean {
  const slug = String(category ?? '').trim()
  if (!slug) return false
  if (slug === 'sale') {
    return products.some(p => p.active !== false && p.promo_price != null)
  }
  const known = new Set<string>([...PRODUCT_CATEGORY_SLUGS, ...customCategories.map(c => c.value)])
  if (!known.has(slug)) return false
  return products.some(p => p.active !== false && p.category === slug)
}
