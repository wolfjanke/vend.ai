import { redirect } from 'next/navigation'
import { getSessionSafe } from '@/lib/auth'
import { sql } from '@/lib/db'
import type { Product, Store } from '@/types'
import { toStorePreviewProducts } from '@/lib/preview-products'
import { getStorePlanContext } from '@/lib/store-plan-access'
import AdminPageError from '@/components/admin/AdminPageError'
import AparenciaClient from './AparenciaClient'
import { adminPage, adminHeader } from '@/lib/admin-ui'

export default async function AparenciaPage() {
  const session = await getSessionSafe()
  if (!session) redirect('/admin')

  let store: Store | undefined
  let previewProducts = toStorePreviewProducts([])

  try {
    const rows = await sql`
      SELECT
        slug, name, plan, is_demo, logo_url, tagline, assistant_name, settings_json,
        theme_name, theme_primary_color, theme_secondary_color, theme_accent_color,
        theme_background, theme_shimmer, theme_logo_url, theme_onboarding_done
      FROM stores
      WHERE id = ${session.storeId}
      LIMIT 1
    `
    store = rows[0] as Store | undefined

    if (store) {
      const products = (await sql`
        SELECT id, name, category, price, promo_price, variants_json
        FROM products
        WHERE store_id = ${session.storeId} AND active = true
        ORDER BY created_at DESC
        LIMIT 12
      `) as Product[]
      previewProducts = toStorePreviewProducts(products, 4)
    }
  } catch (e) {
    console.error('[admin/aparencia] query stores:', e)
    return (
      <AdminPageError title="Aparência">
        Não foi possível carregar os dados de tema. Execute as migrations{' '}
        <code className="font-mono text-xs">008_themes.sql</code>,{' '}
        <code className="font-mono text-xs">010_assistant.sql</code> e{' '}
        <code className="font-mono text-xs">015_store_tagline.sql</code> no banco de produção
        (Neon SQL Editor) e tente novamente.
      </AdminPageError>
    )
  }

  if (!store) redirect('/cadastro')

  const displayLogo = store.theme_logo_url?.trim() || store.logo_url?.trim() || null
  const plan = getStorePlanContext({
    plan: store.plan,
    slug: store.slug,
    is_demo: store.is_demo,
  }).plan

  return (
    <div className={adminPage}>
      <div className={adminHeader}>
        <h1 className="font-syne font-extrabold text-xl sm:text-2xl mb-1">Aparência</h1>
        <p className="text-sm text-muted break-words">
          Temas visuais, cores e preview da vitrine
        </p>
      </div>
      <AparenciaClient
        slug={store.slug}
        plan={plan}
        storeName={store.name}
        logoUrl={displayLogo}
        products={previewProducts}
        assistantName={store.assistant_name?.trim() || 'Vi'}
        tagline={store.tagline ?? null}
        categoryNavStyle={store.settings_json?.categoryNavStyle ?? 'pills'}
        customCategories={store.settings_json?.customCategories ?? []}
        initial={{
          theme_name:            (store.theme_name as string) ?? 'default',
          theme_primary_color:   store.theme_primary_color ?? null,
          theme_secondary_color: store.theme_secondary_color ?? null,
          theme_accent_color:    store.theme_accent_color ?? null,
          theme_background:      (store.theme_background as 'light' | 'dark') ?? 'dark',
          theme_shimmer:         Boolean(store.theme_shimmer),
          theme_logo_url:        store.theme_logo_url ?? store.logo_url ?? null,
        }}
      />
    </div>
  )
}
