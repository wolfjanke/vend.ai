import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Product, Store } from '@/types'
import StoreClient from './StoreClient'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props) {
  const supabase = createClient()
  const { data: store } = await supabase
    .from('stores')
    .select('name')
    .eq('slug', params.slug)
    .single()

  if (!store) return { title: 'Loja não encontrada' }
  return { title: `${store.name} — vend.ai` }
}

export default async function StorePage({ params }: Props) {
  const supabase = createClient()

  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('slug', params.slug)
    .single<Store>()

  if (!store) notFound()

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', store.id)
    .eq('active', true)
    .order('created_at', { ascending: false })

  return <StoreClient store={store} products={(products as Product[]) ?? []} />
}
