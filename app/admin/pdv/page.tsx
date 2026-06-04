import { redirect } from 'next/navigation'
import { getSessionSafe } from '@/lib/auth'
import { sql }            from '@/lib/db'
import AdminPageError     from '@/components/admin/AdminPageError'
import type { Product }   from '@/types'
import PdvClient          from './PdvClient'
import { adminPage, adminHeader } from '@/lib/admin-ui'

export default async function PdvPage() {
  const session = await getSessionSafe()
  if (!session) redirect('/admin')

  let store: { plan: string; asaas_wallet_id: string | null; asaas_onboarding_status: string | null; whatsapp: string }
  let products: Product[]

  try {
    const storeRows = await sql`
      SELECT plan, asaas_wallet_id, asaas_onboarding_status, whatsapp
      FROM stores WHERE id = ${session.storeId} LIMIT 1
    `
    const row = storeRows[0] as typeof store | undefined
    if (!row || row.plan !== 'loja') {
      redirect('/admin/dashboard')
    }
    store = row

    products = (await sql`
      SELECT * FROM products
      WHERE store_id = ${session.storeId} AND active = true
      ORDER BY name ASC
    `) as Product[]
  } catch (e) {
    console.error('[admin/pdv]', e)
    return (
      <AdminPageError title="Mini PDV">
        Não foi possível carregar o PDV. Execute a migration{' '}
        <code className="font-mono text-xs">005_add_asaas_checkout.sql</code> no banco e tente novamente.
      </AdminPageError>
    )
  }

  const storeHasAsaas = store.asaas_onboarding_status === 'APPROVED' && !!store.asaas_wallet_id

  return (
    <div className={adminPage}>
      <div className={adminHeader}>
        <h1 className="font-syne font-extrabold text-xl sm:text-2xl mb-1">Mini PDV</h1>
        <p className="text-sm text-muted">Venda presencial — registre e finalize em segundos</p>
      </div>
      <PdvClient
        storeId={session.storeId}
        products={products}
        storeHasAsaas={storeHasAsaas}
        storeWhatsapp={store.whatsapp}
      />
    </div>
  )
}
