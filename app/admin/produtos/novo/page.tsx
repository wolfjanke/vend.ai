import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getSessionSafe } from '@/lib/auth'
import { sql } from '@/lib/db'
import AdminPageError from '@/components/admin/AdminPageError'
import type { StoreSettings, PlanSlug } from '@/types'
import { getStorePlanContext } from '@/lib/store-plan-access'
import NovoProdutoClient from './NovoProdutoClient'
import { adminPage } from '@/lib/admin-ui'

type Props = {
  searchParams: { guia?: string }
}

export default async function NovoProdutoPage({ searchParams }: Props) {
  const session = await getSessionSafe()
  if (!session) redirect('/admin')

  let settings: StoreSettings = {}
  let plan: PlanSlug = 'free'
  let productCount = 0
  let guided = searchParams.guia === '1'

  try {
    const storeRows = await sql`SELECT settings_json, plan, is_demo, slug FROM stores WHERE id = ${session.storeId} LIMIT 1`
    settings = (storeRows[0]?.settings_json as StoreSettings | null) ?? {}
    plan = getStorePlanContext(storeRows[0] ?? {}).plan

    const countRows = await sql`
      SELECT COUNT(*)::int AS c FROM products WHERE store_id = ${session.storeId} AND active = true
    `
    productCount = Number(countRows[0]?.c ?? 0)
    if (productCount === 0) guided = true
  } catch (e) {
    console.error('[admin/produtos/novo]', e)
    return (
      <AdminPageError title="Novo produto">
        Não foi possível carregar os dados da loja. Tente novamente em instantes.
      </AdminPageError>
    )
  }

  return (
    <div className={adminPage}>
      <Suspense fallback={<p className="text-sm text-muted animate-pulse py-4">Carregando…</p>}>
        <NovoProdutoClient
          storeId={session.storeId}
          customCategories={settings.customCategories ?? []}
          plan={plan}
          guidedFirstProduct={guided}
          isFirstProduct={productCount === 0}
        />
      </Suspense>
    </div>
  )
}
