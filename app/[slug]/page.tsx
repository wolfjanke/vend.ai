import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { sql } from '@/lib/db'
import { isReservedStoreSlug } from '@/lib/reserved-slugs'
import type { Product, Store } from '@/types'
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

  let storeRows: Store[]
  try {
    storeRows = (await sql`SELECT * FROM stores WHERE slug = ${params.slug} LIMIT 1`) as Store[]
  } catch {
    throw new Error('STORE_LOAD_FAILED')
  }

  const store = storeRows[0]
  if (!store) notFound()

  let products: Product[]
  try {
    products = (await sql`
      SELECT * FROM products
      WHERE store_id = ${store.id} AND active = true
      ORDER BY created_at DESC
    `) as Product[]
  } catch {
    throw new Error('STORE_LOAD_FAILED')
  }

  return <StoreClient store={store} products={products} />
}
