import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { sql } from '@/lib/db'
import { isReservedStoreSlug } from '@/lib/reserved-slugs'
import type { Product } from '@/types'
import { toPublicStore, publicStoreAsStore } from '@/lib/public-store'
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
        id, slug, name, logo_url, whatsapp, settings_json, created_at,
        cep, logradouro, numero, complemento, bairro, cidade, uf
      FROM stores
      WHERE slug = ${params.slug}
      LIMIT 1
    `
    storeRow = rows[0] as Record<string, unknown> | undefined
  } catch {
    throw new Error('STORE_LOAD_FAILED')
  }

  if (!storeRow) notFound()
  const storeId = String(storeRow.id)
  const store = publicStoreAsStore(toPublicStore(storeRow))

  let products: Product[]
  try {
    products = (await sql`
      SELECT * FROM products
      WHERE store_id = ${storeId} AND active = true
      ORDER BY created_at DESC
    `) as Product[]
  } catch {
    throw new Error('STORE_LOAD_FAILED')
  }

  return <StoreClient store={store} products={products} />
}
