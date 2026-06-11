import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { sql } from '@/lib/db'
import { isReservedStoreSlug } from '@/lib/reserved-slugs'
import { getCachedActiveProducts, getStoreNameBySlug, getStorePublicRow } from '@/lib/store-public-data'
import type { Product, Store } from '@/types'
import { toPublicStore, publicStoreAsStore } from '@/lib/public-store'
import { resolveStoreTheme } from '@/lib/theme-css'
import { resolveCheckoutAvailability } from '@/lib/checkout-site-enabled'
import LojaShell from '@/components/loja/LojaShell'
import ProductDetailClient from '@/components/loja/ProductDetailClient'
import type { PlanSlug } from '@/lib/plans'

interface Props {
  params: { slug: string; productSlug: string }
}

function appBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://vendai.club'
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (isReservedStoreSlug(params.slug)) return { title: 'vend.ai' }

  const storeName = await getStoreNameBySlug(params.slug)
  if (!storeName) return { title: 'Loja não encontrada' }

  const storeRow = await getStorePublicRow(params.slug)
  const storeId = storeRow?.id
  if (!storeId) return { title: storeName }

  const products = await sql`
    SELECT name, description, price, promo_price, variants_json, slug
    FROM products
    WHERE store_id = ${storeId} AND slug = ${params.productSlug} AND active = true
    LIMIT 1
  `
  const product = products[0] as Product | undefined
  if (!product) return { title: storeName }

  const price = Number(product.promo_price ?? product.price)
  const variants = product.variants_json as Product['variants_json']
  const mainPhoto = variants?.[0]?.photos?.[0]
  const base = appBaseUrl()
  const url = `${base}/${params.slug}/produto/${params.productSlug}`

  return {
    title: `${product.name} — ${storeName}`,
    description: product.description?.slice(0, 160) || `${product.name} disponível em ${storeName}`,
    openGraph: {
      title:       `${product.name} — R$${price.toFixed(2).replace('.', ',')}`,
      description: `Disponível em ${storeName}. Compre pelo WhatsApp!`,
      images:      mainPhoto ? [{ url: mainPhoto }] : undefined,
      url,
    },
  }
}

export default async function ProductPage({ params }: Props) {
  if (isReservedStoreSlug(params.slug)) notFound()

  let storeRow: Record<string, unknown> | undefined
  let product: Product | undefined
  let allProducts: Product[]

  try {
    storeRow = await getStorePublicRow(params.slug)
    if (!storeRow) notFound()

    const storeId = String(storeRow.id)
    const slug = params.slug

    const [productRows, catalog] = await Promise.all([
      sql`
        SELECT
          id, store_id, name, slug, description, category, price, promo_price,
          variants_json, active, created_at
        FROM products
        WHERE store_id = ${storeId} AND slug = ${params.productSlug} AND active = true
        LIMIT 1
      `,
      getCachedActiveProducts(storeId, slug),
    ])
    product = productRows[0] as Product | undefined
    if (!product) notFound()
    allProducts = catalog
  } catch (e) {
    console.error('[store/product]', params.slug, params.productSlug, e)
    notFound()
  }

  const publicStore = toPublicStore(storeRow!)
  const checkoutAvailability = await resolveCheckoutAvailability(params.slug)
  const store = {
    ...publicStoreAsStore(publicStore),
    plan:                    (storeRow!.plan as PlanSlug) ?? 'free',
    assistant_name:          (storeRow!.assistant_name as string) ?? 'Vi',
    assistant_welcome_message: (storeRow!.assistant_welcome_message as string | null) ?? null,
    assistant_tone:          (storeRow!.assistant_tone as Store['assistant_tone']) ?? 'friendly',
    logo_url:                resolveStoreTheme(storeRow!).displayLogo ?? publicStore.logo_url,
    checkoutSiteEnabled:     checkoutAvailability.siteEnabled,
    checkoutWhatsappEnabled: checkoutAvailability.whatsappEnabled,
  }

  const themeResolved = resolveStoreTheme(storeRow!)

  return (
    <LojaShell
      store={store}
      products={allProducts!}
      cardTheme={themeResolved.cardTheme}
      plan={store.plan ?? 'free'}
    >
      <ProductDetailClient product={product!} />
    </LojaShell>
  )
}
