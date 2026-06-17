import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getSessionSafe } from '@/lib/auth'
import { sql } from '@/lib/db'
import type { Product, Store } from '@/types'
import type { PlanSlug } from '@/lib/plans'
import { getViUsageStats } from '@/lib/vi-limits'
import { isCheckoutEnabledForStore, isCheckoutLaunchEnabled } from '@/lib/checkout-enabled'
import { toStorePreviewProducts } from '@/lib/preview-products'
import { getStorePlanContext } from '@/lib/store-plan-access'
import AdminPageError from '@/components/admin/AdminPageError'
import LojaClient from './LojaClient'
import { adminPage } from '@/lib/admin-ui'

const EMPTY_VI_STATS = {
  used:      0,
  limit:     0,
  overage:   0,
  plan:      'free' as PlanSlug,
  percent:   0,
  daysReset: 0,
}

export default async function MinhaLojaPage() {
  const session = await getSessionSafe()
  if (!session) redirect('/admin')

  let store: Store | undefined
  let viStats = EMPTY_VI_STATS
  let previewProducts = toStorePreviewProducts([])

  try {
    const rows = await sql`SELECT * FROM stores WHERE id = ${session.storeId} LIMIT 1`
    store = rows[0] as Store | undefined
    if (!store) redirect('/cadastro')

    viStats = await getViUsageStats(session.storeId)

    const products = (await sql`
      SELECT id, name, category, price, promo_price, variants_json
      FROM products
      WHERE store_id = ${session.storeId} AND active = true
      ORDER BY created_at DESC
      LIMIT 12
    `) as Product[]
    previewProducts = toStorePreviewProducts(products, 4)
  } catch (e) {
    console.error('[admin/loja]', e)
    return (
      <AdminPageError title="Minha loja">
        Não foi possível carregar os dados da loja. Verifique as migrations no banco e tente novamente.
      </AdminPageError>
    )
  }

  const displayLogo = store!.theme_logo_url?.trim() || store!.logo_url?.trim() || null
  const plan = getStorePlanContext({
    plan:    store!.plan,
    slug:    store!.slug,
    is_demo: store!.is_demo,
  }).plan

  const checkoutEligible = isCheckoutEnabledForStore({
    plan:                    (store!.plan ?? 'free') as PlanSlug,
    asaas_onboarding_status: store!.asaas_onboarding_status,
    asaas_wallet_id:         store!.asaas_wallet_id,
    is_demo:                 store!.is_demo,
  })

  const settings = store!.settings_json ?? {}

  return (
    <div className={adminPage}>
      <Suspense fallback={<p className="text-sm text-muted animate-pulse py-4">Carregando…</p>}>
        <LojaClient
          store={store!}
          plan={plan}
          viStats={viStats}
          checkoutEligible={checkoutEligible}
          checkoutLaunchEnabled={isCheckoutLaunchEnabled()}
          displayLogo={displayLogo}
          previewProducts={previewProducts}
          categoryNavStyle={settings.categoryNavStyle ?? 'pills'}
          customCategories={settings.customCategories ?? []}
          vitrineSettings={{
            headerLayout:   settings.headerLayout,
            logoShape:      settings.logoShape,
            brandDisplay:   settings.brandDisplay,
            showSearch:     settings.showSearch,
            logoSize:       settings.logoSize,
            mobileGridCols: settings.mobileGridCols,
          }}
          aparenciaInitial={{
            theme_name:            (store!.theme_name as string) ?? 'default',
            theme_primary_color:   store!.theme_primary_color ?? null,
            theme_secondary_color: store!.theme_secondary_color ?? null,
            theme_accent_color:    store!.theme_accent_color ?? null,
            theme_background:      (store!.theme_background as 'light' | 'dark') ?? 'dark',
            theme_shimmer:         Boolean(store!.theme_shimmer),
          }}
        />
      </Suspense>
    </div>
  )
}
