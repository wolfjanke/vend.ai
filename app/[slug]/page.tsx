import { notFound }  from 'next/navigation'
import { sql }        from '@/lib/db'
import type { Product, Store } from '@/types'
import StoreClient    from './StoreClient'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props) {
  const rows = (await sql`SELECT name FROM stores WHERE slug = ${params.slug} LIMIT 1`) as { name: string }[]
  if (!rows[0]) return { title: 'Loja não encontrada' }
  return { title: `${rows[0].name} — vend.ai` }
}

export default async function StorePage({ params }: Props) {
  const storeRows = (await sql`SELECT * FROM stores WHERE slug = ${params.slug} LIMIT 1`) as Store[]
  const store = storeRows[0]
  if (!store) notFound()

  const products = (await sql`
    SELECT * FROM products
    WHERE store_id = ${store.id} AND active = true
    ORDER BY created_at DESC
  `) as Product[]

  return <StoreClient store={store} products={products} />
}
