import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { sql } from '@/lib/db'
import { isReservedStoreSlug } from '@/lib/reserved-slugs'
import type { Product, Store } from '@/types'
import type { PlanSlug } from '@/lib/plans'
import { toPublicStore, publicStoreAsStore } from '@/lib/public-store'
import { resolveStoreTheme } from '@/lib/theme-css'
import StoreClient from './StoreClient'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (isReservedStoreSlug(params.slug)) {
    return { title: 'vend.ai' }
  }
  try {
    const rows = (await sql`SELECT name FROM stores WHERE slug = ${params.slug} LIMIT 1`) as { name: string }[]
    if (!rows[0]) return { title: 'Loja não encontrada' }
    return { title: `${rows[0].name} — vend.ai` }
  } catch {
    return { title: 'vend.ai' }
  }
}

export default async function StorePage({ params }: Props) {
  if (isReservedStoreSlug(params.slug)) notFound()

  let storeRow: Record<string, unknown> | undefined
  try {
    const rows = await sql`
      SELECT
        id, slug, name, logo_url, tagline, whatsapp, settings_json, created_at,
        cep, logradouro, numero, complemento, bairro, cidade, uf,
        theme_name, theme_primary_color, theme_secondary_color, theme_accent_color,
        theme_background, theme_shimmer, theme_logo_url,
        plan, assistant_name, assistant_welcome_message, assistant_tone
      FROM stores
      WHERE slug = ${params.slug}
      LIMIT 1
    `
    storeRow = rows[0] as Record<string, unknown> | undefined
  } catch (e) {
    console.error('[store/page]', params.slug, e)
    notFound()
  }

  if (!storeRow) notFound()

  const storeId = String(storeRow.id)
  const publicStore = toPublicStore(storeRow)
  const themeResolved = resolveStoreTheme(storeRow)
  const store: Store = {
    ...publicStoreAsStore(publicStore),
    logo_url:                themeResolved.displayLogo ?? publicStore.logo_url,
    plan:                    (storeRow.plan as PlanSlug) ?? 'free',
    assistant_name:          (storeRow.assistant_name as string) ?? 'Vi',
    assistant_welcome_message: (storeRow.assistant_welcome_message as string | null) ?? null,
    assistant_tone:          (storeRow.assistant_tone as Store['assistant_tone']) ?? 'friendly',
  }

  let products: Product[]
  try {
    products = (await sql`
      SELECT * FROM products
      WHERE store_id = ${storeId} AND active = true
      ORDER BY created_at DESC
    `) as Product[]
  } catch (e) {
    console.error('[store/page] products', params.slug, e)
    notFound()
  }

  return (
    <StoreClient
      store={store}
      products={products}
      cardTheme={themeResolved.cardTheme}
      plan={store.plan ?? 'free'}
    />
  )
}
