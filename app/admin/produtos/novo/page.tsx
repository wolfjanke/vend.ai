import { redirect }  from 'next/navigation'
import { getSessionSafe } from '@/lib/auth'
import { sql } from '@/lib/db'
import AdminPageError from '@/components/admin/AdminPageError'
import ProdutoForm    from '@/components/admin/ProdutoForm'
import { adminPage, adminHeader } from '@/lib/admin-ui'
import type { StoreSettings, PlanSlug } from '@/types'

export default async function NovoProdutoPage() {
  const session = await getSessionSafe()
  if (!session) redirect('/admin')

  let settings: StoreSettings
  let plan: PlanSlug = 'free'
  try {
    const storeRows = await sql`SELECT settings_json, plan FROM stores WHERE id = ${session.storeId} LIMIT 1`
    settings = (storeRows[0]?.settings_json as StoreSettings | null) ?? {}
    plan = (storeRows[0]?.plan as PlanSlug) ?? 'free'
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
      <div className={adminHeader}>
        <h1 className="font-syne font-extrabold text-xl sm:text-2xl mb-1">Novo produto</h1>
        <p className="text-sm text-muted">
          Selecione as fotos da galeria — a IA identifica variações de cor e preenche tudo automaticamente
        </p>
      </div>
      <ProdutoForm storeId={session.storeId} customCategories={settings.customCategories ?? []} plan={plan} />
    </div>
  )
}
