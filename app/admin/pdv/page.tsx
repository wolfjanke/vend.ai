import { redirect } from 'next/navigation'
import { getSessionSafe } from '@/lib/auth'
import { sql }            from '@/lib/db'
import type { Product }   from '@/types'
import PdvClient          from './PdvClient'

export default async function PdvPage() {
  const session = await getSessionSafe()
  if (!session) redirect('/admin')

  const storeRows = await sql`
    SELECT plan, asaas_wallet_id, asaas_onboarding_status, whatsapp
    FROM stores WHERE id = ${session.storeId} LIMIT 1
  `
  const store = storeRows[0]

  if (!store || store.plan !== 'loja') {
    redirect('/admin/dashboard')
  }

  const products = await sql`
    SELECT * FROM products
    WHERE store_id = ${session.storeId} AND active = true
    ORDER BY name ASC
  `

  const storeHasAsaas = store.asaas_onboarding_status === 'APPROVED' && !!store.asaas_wallet_id

  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <h1 className="font-syne font-extrabold text-xl sm:text-2xl mb-1">Mini PDV</h1>
        <p className="text-sm text-muted">Venda presencial — registre e finalize em segundos</p>
      </div>
      <PdvClient
        storeId={session.storeId}
        products={products as Product[]}
        storeHasAsaas={storeHasAsaas}
        storeWhatsapp={store.whatsapp as string}
      />
    </div>
  )
}
