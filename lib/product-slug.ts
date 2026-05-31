import { slugify } from '@/lib/masks'
import { sql } from '@/lib/db'

/** Gera slug único entre os já usados na loja. */
export function uniqueProductSlug(name: string, existing: Set<string>): string {
  const base = slugify(name) || `produto-${Date.now()}`
  if (!existing.has(base)) return base
  let n = 2
  while (existing.has(`${base}-${n}`)) n++
  return `${base}-${n}`
}

export async function resolveProductSlugForStore(
  storeId: string,
  name: string,
  excludeProductId?: string,
): Promise<string> {
  const rows = excludeProductId
    ? await sql`
        SELECT slug FROM products
        WHERE store_id = ${storeId} AND slug IS NOT NULL AND id != ${excludeProductId}
      `
    : await sql`
        SELECT slug FROM products
        WHERE store_id = ${storeId} AND slug IS NOT NULL
      `
  const existing = new Set(
    rows.map((r: { slug: string | null }) => r.slug).filter(Boolean) as string[],
  )
  return uniqueProductSlug(name, existing)
}
