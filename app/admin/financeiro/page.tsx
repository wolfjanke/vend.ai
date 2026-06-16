import { redirect } from 'next/navigation'
import { getSessionSafe } from '@/lib/auth'
import { sql } from '@/lib/db'
import { isCheckoutLaunchEnabled } from '@/lib/checkout-enabled'
import FinanceiroClient from './FinanceiroClient'
import { adminPage, adminHeader } from '@/lib/admin-ui'

export default async function FinanceiroPage() {
  const session = await getSessionSafe()
  if (!session) redirect('/admin')

  const storeRows = await sql`SELECT plan FROM stores WHERE id = ${session.storeId} LIMIT 1`
  const plan = storeRows[0]?.plan ?? 'free'

  if (!isCheckoutLaunchEnabled()) {
    return (
      <div className={adminPage}>
        <div className={adminHeader}>
          <h1 className="font-syne font-extrabold text-xl sm:text-2xl mb-1">Financeiro</h1>
          <p className="text-sm text-muted">Extrato de vendas processadas pelo checkout e PDV</p>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 max-w-2xl">
          <p className="font-syne font-bold text-foreground mb-2">Em breve</p>
          <p className="text-sm text-muted break-words">
            O extrato financeiro estará disponível quando o checkout integrado for lançado na plataforma.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={adminPage}>
      <div className={adminHeader}>
        <h1 className="font-syne font-extrabold text-xl sm:text-2xl mb-1">Financeiro</h1>
        <p className="text-sm text-muted">Extrato de vendas processadas pelo checkout e PDV</p>
      </div>
      <FinanceiroClient plan={plan as string} />
    </div>
  )
}
