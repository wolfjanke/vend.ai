import { redirect } from 'next/navigation'
import { getSessionSafe } from '@/lib/auth'
import { sql } from '@/lib/db'
import FinanceiroClient from './FinanceiroClient'

export default async function FinanceiroPage() {
  const session = await getSessionSafe()
  if (!session) redirect('/admin')

  const storeRows = await sql`SELECT plan FROM stores WHERE id = ${session.storeId} LIMIT 1`
  const plan = storeRows[0]?.plan ?? 'free'

  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <h1 className="font-syne font-extrabold text-xl sm:text-2xl mb-1">Financeiro</h1>
        <p className="text-sm text-muted">Extrato de vendas processadas pelo checkout e PDV</p>
      </div>
      <FinanceiroClient plan={plan as string} />
    </div>
  )
}
