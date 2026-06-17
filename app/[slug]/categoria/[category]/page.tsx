import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isReservedStoreSlug } from '@/lib/reserved-slugs'
import type { Product, Store } from '@/types'
import { getCategoryDisplayLabel } from '@/types'
import type { PlanSlug } from '@/lib/plans'
import { toPublicStore, publicStoreAsStore } from '@/lib/public-store'
import { resolveStoreTheme } from '@/lib/theme-css'
import { getCachedActiveProducts, getStorePublicRow } from '@/lib/store-public-data'
import { resolveCheckoutAvailability } from '@/lib/checkout-site-enabled'
import { isValidStoreCategory } from '@/lib/category-routes'
import StoreClient from '../../StoreClient'

interface Props {
  params: { slug: string; category: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (isReservedStoreSlug(params.slug)) {
    return { title: 'vendai.club' }
  }

  try {
    const storeRow = await getStorePublicRow(params.slug)
    if (!storeRow) return { title: 'Loja não encontrada' }

    const publicStore = toPublicStore(storeRow)
    const settings = publicStore.settings_json ?? {}
    const customCategories = settings.customCategories ?? []
    const categorySlug = decodeURIComponent(params.category)

    const label =
      categorySlug === 'sale'
        ? 'Promoções'
        : getCategoryDisplayLabel(categorySlug, customCategories)

    return { title: `${label} — ${publicStore.name}` }
  } catch {
    return { title: 'vendai.club' }
  }
}

export default async function StoreCategoryPage({ params }: Props) {
  if (isReservedStoreSlug(params.slug)) notFound()

  const categorySlug = decodeURIComponent(params.category)

  let storeRow: Record<string, unknown> | undefined
  try {
    storeRow = await getStorePublicRow(params.slug)
  } catch (e) {
    console.error('[store/categoria]', params.slug, e)
    notFound()
  }

  if (!storeRow) notFound()

  const storeId = String(storeRow.id)
  const slug = params.slug
  const publicStore = toPublicStore(storeRow)
  const themeResolved = resolveStoreTheme(storeRow)
  const checkoutAvailability = await resolveCheckoutAvailability(slug)
  const customCategories = publicStore.settings_json?.customCategories ?? []

  const store: Store = {
    ...publicStoreAsStore(publicStore),
    logo_url:                themeResolved.displayLogo ?? publicStore.logo_url,
    plan:                    (storeRow.plan as PlanSlug) ?? 'free',
    assistant_name:          (storeRow.assistant_name as string) ?? 'Vi',
    assistant_welcome_message: (storeRow.assistant_welcome_message as string | null) ?? null,
    assistant_tone:          (storeRow.assistant_tone as Store['assistant_tone']) ?? 'friendly',
    assistant_gender:        (storeRow.assistant_gender as Store['assistant_gender']) ?? 'feminine',
    checkoutSiteEnabled:     checkoutAvailability.siteEnabled,
    checkoutWhatsappEnabled: checkoutAvailability.whatsappEnabled,
  }

  let products: Product[]
  try {
    products = await getCachedActiveProducts(storeId, slug)
  } catch (e) {
    console.error('[store/categoria] products', params.slug, e)
    throw e
  }

  if (!isValidStoreCategory(categorySlug, products, customCategories)) {
    notFound()
  }

  return (
    <StoreClient
      store={store}
      products={products}
      cardTheme={themeResolved.cardTheme}
      plan={store.plan ?? 'free'}
      initialCategory={categorySlug}
      useCategoryLinks
    />
  )
}
