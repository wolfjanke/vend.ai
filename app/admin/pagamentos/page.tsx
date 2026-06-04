import { redirect }   from 'next/navigation'
import { getSessionSafe } from '@/lib/auth'
import { sql }            from '@/lib/db'
import { getOnboardingUrl } from '@/lib/asaas/subaccounts'
import AdminPageError     from '@/components/admin/AdminPageError'
import type { PlanSlug, AsaasOnboardingStatus } from '@/types'
import { PLAN_PRODUCT_LIMITS } from '@/types'
import { getTakeRates, getTakeRateSync } from '@/lib/take-rates'
import OnboardingForm    from './OnboardingForm'
import OnboardingPending from './OnboardingPending'
import { adminPage, adminHeader } from '@/lib/admin-ui'

export default async function PagamentosPage() {
  const session = await getSessionSafe()
  if (!session) redirect('/admin')

  let store: Record<string, unknown>
  try {
    const rows = await sql`
      SELECT
        plan,
        asaas_account_id,
        asaas_wallet_id,
        asaas_onboarding_status,
        asaas_approved_at
      FROM stores
      WHERE id = ${session.storeId}
      LIMIT 1
    `
    store = (rows[0] ?? {}) as Record<string, unknown>
  } catch (e) {
    console.error('[admin/pagamentos]', e)
    return (
      <AdminPageError title="Pagamentos">
        Não foi possível carregar os dados de pagamento. Execute a migration{' '}
        <code className="font-mono text-xs">005_add_asaas_checkout.sql</code> no banco e tente novamente.
      </AdminPageError>
    )
  }

  const plan              = (store.plan ?? 'free') as PlanSlug
  const onboardingStatus  = (store.asaas_onboarding_status ?? null) as AsaasOnboardingStatus | null
  const hasAccount        = !!store.asaas_account_id

  const takeRates  = await getTakeRates()
  const takePct    = getTakeRateSync(plan, takeRates)
  const merchantPct = 100 - takePct
  const limitLabel  = PLAN_PRODUCT_LIMITS[plan] === null ? 'Ilimitado' : String(PLAN_PRODUCT_LIMITS[plan])

  let onboardingUrl: string | null = null
  if (hasAccount && onboardingStatus !== 'APPROVED' && onboardingStatus !== 'REJECTED') {
    onboardingUrl = await getOnboardingUrl(session.storeId)
  }

  return (
    <div className={adminPage}>
      <div className={adminHeader}>
        <h1 className="font-syne font-extrabold text-xl sm:text-2xl mb-1">Pagamentos</h1>
        <p className="text-sm text-muted">Configure o recebimento pelo checkout integrado</p>
      </div>

      {onboardingStatus === 'APPROVED' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="bg-surface border border-accent/30 rounded-2xl p-5 xl:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent-glow)]" />
            <span className="font-syne font-bold text-accent">Pagamentos ativos</span>
          </div>
          <p className="text-sm text-muted mb-4 break-words">
            Seu checkout integrado está ativo. As vendas realizadas pelo site são processadas automaticamente com split.
          </p>
          <div className="bg-surface2 border border-border rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Plano atual</span>
              <span className="font-semibold capitalize">{plan}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Você retém por venda</span>
              <span className="font-semibold text-accent">{merchantPct.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Taxa plataforma</span>
              <span className="font-semibold">{takePct.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Limite de produtos</span>
              <span className="font-semibold">{limitLabel}</span>
            </div>
          </div>
          <p className="text-xs text-muted mt-3 break-words">
            Taxas de parcelamento são adicionadas ao valor do cliente. Você sempre recebe o valor cheio do produto.
          </p>
          </div>
          <div className="bg-surface border border-border rounded-2xl p-5 h-fit">
            <h2 className="font-syne font-bold text-base mb-2">Próximos passos</h2>
            <ul className="text-sm text-muted space-y-2 break-words">
              <li>• Acompanhe repasses em Financeiro.</li>
              <li>• Revise limites e taxa no menu Plano.</li>
              <li>• Use PDV para vendas presenciais.</li>
            </ul>
          </div>
        </div>
      )}

      {onboardingStatus === 'REJECTED' && (
        <div className="bg-surface border border-warm/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-warm" />
            <span className="font-syne font-bold text-warm">Cadastro recusado</span>
          </div>
          <p className="text-sm text-muted mb-4 break-words">
            Seu cadastro junto ao processador de pagamentos foi recusado. Entre em contato com o suporte para verificar os motivos ou tente novamente com dados corretos.
          </p>
          <OnboardingForm storeId={session.storeId} />
        </div>
      )}

      {hasAccount && (onboardingStatus === 'PENDING' || onboardingStatus === 'AWAITING_APPROVAL') && (
        <OnboardingPending onboardingUrl={onboardingUrl} status={onboardingStatus} />
      )}

      {!hasAccount && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="bg-surface border border-border rounded-2xl p-5 xl:col-span-1 h-fit">
            <h2 className="font-syne font-bold text-base mb-2">Ativar recebimentos</h2>
            <p className="text-sm text-muted mb-5 break-words">
              Para aceitar pagamentos pelo checkout, precisamos criar sua conta de recebedor. Preencha os dados abaixo — é rápido e gratuito.
            </p>
            <div className="text-xs text-muted space-y-2">
              <p>• Cadastro é feito uma vez por loja.</p>
              <p>• Você pode continuar vendendo por WhatsApp normalmente.</p>
              <p>• Após aprovação, checkout fica ativo automaticamente.</p>
            </div>
          </div>
          <div className="bg-surface border border-border rounded-2xl p-5 xl:col-span-2">
            <OnboardingForm storeId={session.storeId} />
          </div>
        </div>
      )}
    </div>
  )
}
