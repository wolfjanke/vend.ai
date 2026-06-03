import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { sql } from '@/lib/db'
import type { Product, ProductVariant } from '@/types'

export type StorePublicRow = Record<string, unknown>

/** Uma query por request — compartilhada entre layout, page e generateMetadata. */
export const getStorePublicRow = cache(async (slug: string): Promise<StorePublicRow | undefined> => {
  const rows = await sql`
    SELECT
      id, slug, name, logo_url, tagline, whatsapp, settings_json, created_at,
      cep, logradouro, numero, complemento, bairro, cidade, uf,
      theme_name, theme_primary_color, theme_secondary_color, theme_accent_color,
      theme_background, theme_shimmer, theme_logo_url,
      plan, assistant_name, assistant_welcome_message, assistant_tone
    FROM stores
    WHERE slug = ${slug}
    LIMIT 1
  `
  return rows[0] as StorePublicRow | undefined
})

export const getStoreNameBySlug = cache(async (slug: string): Promise<string | null> => {
  const row = await getStorePublicRow(slug)
  return row ? String(row.name) : null
})

function slimVariantForVi(v: ProductVariant): ProductVariant {
  return {
    id:          v.id,
    color:       v.color,
    colorHex:    v.colorHex,
    variantType: v.variantType,
    stock:       v.stock ?? {},
    photos:      [],
  }
}

/** Catálogo enxuto para a Vi — sem URLs de foto (evita prompt >2MB e falha no cache do Next). */
export function slimProductsForVi(products: Product[]): Product[] {
  return products.map(p => ({
    ...p,
    description:   (p.description ?? '').slice(0, 200),
    variants_json: (p.variants_json ?? []).map(slimVariantForVi),
  }))
}

function fetchActiveProducts(storeId: string): Promise<Product[]> {
  return sql`
    SELECT
      id, store_id, name, slug, description, category, price, promo_price,
      variants_json, active, created_at
    FROM products
    WHERE store_id = ${storeId} AND active = true
    ORDER BY created_at DESC
  ` as Promise<Product[]>
}

/** Cache entre requests na vitrine (Neon + RSC). Invalidar com tag \`store-{slug}\`. */
export function getCachedActiveProducts(storeId: string, slug: string): Promise<Product[]> {
  return unstable_cache(
    () => fetchActiveProducts(storeId),
    ['store-active-products', storeId],
    { revalidate: 60, tags: [`store-${slug}`] },
  )()
}

/** Query direta para /api/vi — sem unstable_cache (payload grande estoura limite de 2MB do Next). */
export async function getActiveProductsForVi(storeId: string): Promise<Product[]> {
  const rows = await fetchActiveProducts(storeId)
  return slimProductsForVi(rows)
}

/** @deprecated Prefer getActiveProductsForVi na rota /api/vi */
export function getCachedActiveProductsForVi(storeId: string, slug: string): Promise<Product[]> {
  return getActiveProductsForVi(storeId)
}
