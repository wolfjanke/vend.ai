import { redirect } from 'next/navigation'
import { getSessionSafe } from '@/lib/auth'
import { sql } from '@/lib/db'
import type { Store } from '@/types'
import MarketingForm from './MarketingForm'

export default async function MarketingPage() {
  const session = await getSessionSafe()
  if (!session) redirect('/admin')

  const rows = await sql`SELECT * FROM stores WHERE id = ${session.storeId} LIMIT 1`
  const store = rows[0] as Store | undefined

  if (!store) redirect('/cadastro')

  return (
    <div className="animate-fade-up max-w-3xl">
      <div className="mb-6">
        <h1 className="font-syne font-extrabold text-xl sm:text-2xl mb-1">Marketing</h1>
        <p className="text-sm text-muted">Gerencie promoções, cupons e banners da loja</p>
      </div>
      <MarketingForm store={store} />
    </div>
  )
}
