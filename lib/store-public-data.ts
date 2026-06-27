import { cache } from 'react'
import { sql } from '@/lib/db'
import type { Product, ProductVariant } from '@/types'

export type StorePublicRow = Record<string, unknown>

const QUERY_TIMEOUT_MS = 12_000
/** Catálogo traz `variants_json` com fotos — lojas com payload grande + cold start Neon podem passar de 12s. */
const PRODUCTS_QUERY_TIMEOUT_MS = 30_000

async function withQueryTimeout<T>(
  promise: Promise<T>,
  label: string,
  ms = QUERY_TIMEOUT_MS,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`[db] ${label} timed out after ${ms}ms`)),
      ms,
    )
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

/** Uma query por request — compartilhada entre layout, page e generateMetadata. */
export const getStorePublicRow = cache(async (slug: string): Promise<StorePublicRow | undefined> => {
  const rows = await withQueryTimeout(
    sql`
    SELECT
      id, slug, name, logo_url, tagline, whatsapp, settings_json, created_at,
      cep, logradouro, numero, complemento, bairro, cidade, uf,
      theme_name, theme_primary_color, theme_secondary_color, theme_accent_color,
      theme_page_bg_color, theme_background, theme_shimmer, theme_logo_url,
      plan, assistant_name, assistant_welcome_message, assistant_tone, assistant_gender
    FROM stores
    WHERE slug = ${slug}
    LIMIT 1
  `,
    `getStorePublicRow(${slug})`,
  )
  return rows[0] as StorePublicRow | undefined
})

export const getStoreNameBySlug = cache(async (slug: string): Promise<string | null> => {
  const row = await getStorePublicRow(slug)
  return row ? String(row.name) : null
})

function slimVariantForVi(v: ProductVariant): ProductVariant {
  return {
    id:               v.id,
    color:            v.color,
    colorHex:         v.colorHex,
    variantType:      v.variantType,
    stock:            v.stock ?? {},
    stockPrices:      v.stockPrices,
    stockPromoPrices: v.stockPromoPrices,
    photos:           [],
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
  return withQueryTimeout(
    sql`
    SELECT
      id, store_id, name, slug, description, category, audience, price, promo_price,
      variants_json, catalog_axes, active, created_at
    FROM products
    WHERE store_id = ${storeId} AND active = true
    ORDER BY created_at DESC
  ` as Promise<Product[]>,
    `fetchActiveProducts(${storeId})`,
    PRODUCTS_QUERY_TIMEOUT_MS,
  )
}

/**
 * Produtos ativos da vitrine — dedupe por request (React cache).
 * Não usa unstable_cache: catálogos com variants_json grandes (>2MB) estouram o incremental cache
 * do Next e derrubam o dev server (unhandledRejection). Invalidar com revalidatePath /{slug}.
 */
const getActiveProductsByStoreId = cache(async (storeId: string): Promise<Product[]> => {
  return fetchActiveProducts(storeId)
})

export function getCachedActiveProducts(storeId: string, _slug: string): Promise<Product[]> {
  return getActiveProductsByStoreId(storeId)
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
