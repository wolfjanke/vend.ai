import { redirect }  from 'next/navigation'
import { getSessionSafe } from '@/lib/auth'
import { sql }        from '@/lib/db'
import ConfigForm     from './ConfigForm'
import AdminPageError from '@/components/admin/AdminPageError'
import type { Store } from '@/types'
import type { PlanSlug } from '@/lib/plans'
import { getViUsageStats } from '@/lib/vi-limits'
import { isCheckoutEnabledForStore, isCheckoutLaunchEnabled } from '@/lib/checkout-enabled'
import { adminPage, adminHeader } from '@/lib/admin-ui'

const EMPTY_VI_STATS = {
  used:      0,
  limit:     0,
  overage:   0,
  plan:      'free' as PlanSlug,
  percent:   0,
  daysReset: 0,
}

export default async function ConfiguracoesPage() {
  const session = await getSessionSafe()
  if (!session) redirect('/admin')

  let store: Store | undefined
  let viStats = EMPTY_VI_STATS

  try {
    const rows = await sql`SELECT * FROM stores WHERE id = ${session.storeId} LIMIT 1`
    store = rows[0] as Store | undefined
    if (!store) redirect('/cadastro')
    viStats = await getViUsageStats(session.storeId)
  } catch (e) {
    console.error('[admin/configuracoes]', e)
    return (
      <AdminPageError title="Configurações">
        Não foi possível carregar os dados da loja. Execute as migrations{' '}
        <code className="font-mono text-xs">007_store_vi_usage.sql</code> e{' '}
        <code className="font-mono text-xs">010_assistant.sql</code> no banco e tente novamente.
      </AdminPageError>
    )
  }

  const checkoutEligible = isCheckoutEnabledForStore({
    plan:                    (store!.plan ?? 'free') as PlanSlug,
    asaas_onboarding_status: store!.asaas_onboarding_status,
    asaas_wallet_id:         store!.asaas_wallet_id,
    is_demo:                 store!.is_demo,
  })

  return (
    <div className={adminPage}>
      <div className={adminHeader}>
        <h1 className="font-syne font-extrabold text-xl sm:text-2xl mb-1">Configurações</h1>
        <p className="text-sm text-muted">Gerencie os dados gerais da sua loja</p>
      </div>
      <ConfigForm
        store={store!}
        viStats={viStats}
        checkoutEligible={checkoutEligible}
        checkoutLaunchEnabled={isCheckoutLaunchEnabled()}
      />
    </div>
  )
}
