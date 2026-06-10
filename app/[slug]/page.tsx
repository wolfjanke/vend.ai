import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isReservedStoreSlug } from '@/lib/reserved-slugs'
import type { Product, Store } from '@/types'
import type { PlanSlug } from '@/lib/plans'
import { toPublicStore, publicStoreAsStore } from '@/lib/public-store'
import { resolveStoreTheme } from '@/lib/theme-css'
import { getCachedActiveProducts, getStoreNameBySlug, getStorePublicRow } from '@/lib/store-public-data'
import { resolveCheckoutSiteEnabled } from '@/lib/checkout-site-enabled'
import StoreClient from './StoreClient'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (isReservedStoreSlug(params.slug)) {
    return { title: 'vend.ai' }
  }
  try {
    const name = await getStoreNameBySlug(params.slug)
    if (!name) return { title: 'Loja não encontrada' }
    return { title: `${name} — vend.ai` }
  } catch {
    return { title: 'vend.ai' }
  }
}

export default async function StorePage({ params }: Props) {
  if (isReservedStoreSlug(params.slug)) notFound()

  let storeRow: Record<string, unknown> | undefined
  try {
    storeRow = await getStorePublicRow(params.slug)
  } catch (e) {
    console.error('[store/page]', params.slug, e)
    notFound()
  }

  if (!storeRow) notFound()

  const storeId = String(storeRow.id)
  const slug = params.slug
  const publicStore = toPublicStore(storeRow)
  const themeResolved = resolveStoreTheme(storeRow)
  const checkoutSiteEnabled = await resolveCheckoutSiteEnabled(slug, publicStore.settings_json)

  const store: Store = {
    ...publicStoreAsStore(publicStore),
    logo_url:                themeResolved.displayLogo ?? publicStore.logo_url,
    plan:                    (storeRow.plan as PlanSlug) ?? 'free',
    assistant_name:          (storeRow.assistant_name as string) ?? 'Vi',
    assistant_welcome_message: (storeRow.assistant_welcome_message as string | null) ?? null,
    assistant_tone:          (storeRow.assistant_tone as Store['assistant_tone']) ?? 'friendly',
    checkoutSiteEnabled,
  }

  let products: Product[]
  try {
    products = await getCachedActiveProducts(storeId, slug)
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
