import Link from 'next/link'
import { CreditCard } from 'lucide-react'
import { redirect } from 'next/navigation'
import { getSessionSafe } from '@/lib/auth'
import { sql } from '@/lib/db'
import { getOnboardingUrl } from '@/lib/asaas/subaccounts'
import AdminPageError from '@/components/admin/AdminPageError'
import type { PlanSlug, AsaasOnboardingStatus } from '@/types'
import { getPlan, isPlanCheckoutEligible } from '@/lib/plans'
import { getTakeRates, getTakeRateSync, getFixedTransactionFee } from '@/lib/take-rates'
import { isCheckoutEnabledForStore, isCheckoutLaunchEnabled } from '@/lib/checkout-enabled'
import OnboardingForm from './OnboardingForm'
import OnboardingPending from './OnboardingPending'
import { adminPage, adminHeader } from '@/lib/admin-ui'

const MEI_URL = 'https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/servicos-para-mei/abertura'

function EstadoGratis() {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 max-w-2xl">
      <p className="text-xs font-bold tracking-wider uppercase text-primary mb-2">Checkout integrado</p>
      <h2 className="font-syne font-bold text-lg sm:text-xl mb-3 break-words flex items-center gap-2">
        <CreditCard size={22} className="shrink-0 text-primary" aria-hidden />
        Aceite cartão na sua loja
      </h2>
      <p className="text-sm text-muted leading-relaxed break-words mb-4">
        Seus clientes poderão pagar com cartão diretamente no site, em até 12x.
      </p>
      <p className="text-sm font-semibold text-foreground mb-2">Para ativar o checkout:</p>
      <ul className="text-sm text-muted space-y-1.5 mb-6 break-words">
        <li>✓ Faça upgrade para o plano Starter ou superior</li>
        <li>✓ Cadastre seu CNPJ (MEI conta!)</li>
        <li>✓ Pronto — checkout ativo em minutos</li>
      </ul>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/admin/plano"
          className="inline-flex min-h-[44px] items-center justify-center px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:opacity-90"
        >
          Fazer upgrade →
        </Link>
        <a
          href={MEI_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center justify-center px-4 py-2 border border-border text-sm font-semibold rounded-xl hover:border-primary hover:text-primary transition-colors"
        >
          Abrir MEI grátis no gov.br →
        </a>
      </div>
    </div>
  )
}

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
        asaas_approved_at,
        is_demo
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

  const plan             = (store.plan ?? 'free') as PlanSlug
  const onboardingStatus = (store.asaas_onboarding_status ?? null) as AsaasOnboardingStatus | null
  const hasAccount       = !!store.asaas_account_id
  const planDef          = getPlan(plan)

  const storeInput = {
    plan,
    asaas_onboarding_status: onboardingStatus,
    asaas_wallet_id:         store.asaas_wallet_id as string | null | undefined,
    is_demo:                 store.is_demo as boolean | null | undefined,
  }

  const checkoutActive = isCheckoutEnabledForStore(storeInput)
  const paidCheckoutPlan = isPlanCheckoutEligible(plan)

  const takeRates  = await getTakeRates()
  const fixedFee   = await getFixedTransactionFee()
  const takePct    = getTakeRateSync(plan, takeRates)

  let onboardingUrl: string | null = null
  if (paidCheckoutPlan && hasAccount && onboardingStatus !== 'APPROVED' && onboardingStatus !== 'REJECTED') {
    onboardingUrl = await getOnboardingUrl(session.storeId)
  }

  const checklist = [
    { label: 'CNPJ cadastrado', done: hasAccount },
    {
      label: 'Documentos enviados',
      done: onboardingStatus === 'PENDING' || onboardingStatus === 'AWAITING_APPROVAL' || onboardingStatus === 'APPROVED',
    },
    { label: 'Conta aprovada', done: onboardingStatus === 'APPROVED' },
  ]

  return (
    <div className={adminPage}>
      <div className={adminHeader}>
        <h1 className="font-syne font-extrabold text-xl sm:text-2xl mb-1">Pagamentos</h1>
        <p className="text-sm text-muted break-words">
          {checkoutActive
            ? 'Checkout ativo na sua loja'
            : paidCheckoutPlan
              ? 'Configure o recebimento por cartão'
              : 'Receba pedidos pelo WhatsApp — checkout nos planos pagos'}
        </p>
      </div>

      {!isCheckoutLaunchEnabled() && paidCheckoutPlan && (
        <div className="mb-4 p-3 rounded-xl border border-warm/30 bg-warm/10 text-xs text-warm break-words">
          Checkout temporariamente indisponível na plataforma. Tente novamente em breve.
        </div>
      )}

      {!paidCheckoutPlan ? (
        <EstadoGratis />
      ) : checkoutActive ? (
        <div className="bg-surface border border-accent/30 rounded-2xl p-5 sm:p-6 max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent-glow)]" />
            <span className="font-syne font-bold text-accent">Checkout ativo</span>
          </div>
          <p className="text-sm text-muted leading-relaxed break-words mb-4">
            Seus clientes podem pagar com cartão na sua loja.
            {' '}
            Take rate: {takePct.toFixed(2).replace('.', ',')}% + R${fixedFee.toFixed(2).replace('.', ',')} por transação.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/admin/pedidos"
              className="inline-flex min-h-[44px] items-center justify-center px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:opacity-90"
            >
              Ver vendas →
            </Link>
            <Link
              href="/admin/configuracoes"
              className="inline-flex min-h-[44px] items-center justify-center px-4 py-2 border border-border text-sm font-semibold rounded-xl hover:border-primary hover:text-primary transition-colors"
            >
              Configurações →
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 max-w-2xl mb-6">
            <h2 className="font-syne font-bold text-base sm:text-lg mb-2 break-words">
              Configure sua conta para receber por cartão
            </h2>
            <p className="text-sm text-muted break-words mb-4">
              Você está no plano {planDef.name}. Para ativar o checkout:
            </p>
            <ul className="space-y-2 mb-5">
              {checklist.map(item => (
                <li key={item.label} className="flex items-center gap-2 text-sm">
                  <span className={`size-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    item.done ? 'bg-accent/20 text-accent' : 'bg-surface2 text-muted border border-border'
                  }`}>
                    {item.done ? '✓' : '○'}
                  </span>
                  <span className={item.done ? 'text-foreground' : 'text-muted'}>{item.label}</span>
                </li>
              ))}
            </ul>
            {!hasAccount && onboardingStatus !== 'REJECTED' && (
              <p className="text-xs text-muted mb-4 break-words">
                Preencha os dados abaixo para criar sua subconta de recebimento (CNPJ obrigatório).
              </p>
            )}
          </div>

          {onboardingStatus === 'REJECTED' && (
            <div className="bg-surface border border-warm/30 rounded-2xl p-5 mb-6 max-w-2xl">
              <p className="font-syne font-bold text-warm mb-2">Cadastro recusado</p>
              <p className="text-sm text-muted mb-4 break-words">
                Verifique os dados do CNPJ e tente novamente ou fale com o suporte.
              </p>
              <OnboardingForm storeId={session.storeId} />
            </div>
          )}

          {hasAccount && (onboardingStatus === 'PENDING' || onboardingStatus === 'AWAITING_APPROVAL') && (
            <div className="max-w-2xl mb-6">
              <OnboardingPending onboardingUrl={onboardingUrl} status={onboardingStatus} />
            </div>
          )}

          {!hasAccount && onboardingStatus !== 'REJECTED' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-4xl">
              <div className="bg-surface border border-border rounded-2xl p-5 h-fit">
                <p className="text-xs text-muted space-y-2 break-words">
                  <span className="block">• Cadastro único por loja (CNPJ).</span>
                  <span className="block">• Continue vendendo pelo WhatsApp enquanto aguarda.</span>
                  <span className="block">• Após aprovação, ative o modo desejado em Configurações.</span>
                </p>
              </div>
              <div className="bg-surface border border-border rounded-2xl p-5 xl:col-span-2">
                <OnboardingForm storeId={session.storeId} />
              </div>
            </div>
          )}

          {hasAccount && onboardingStatus !== 'APPROVED' && onboardingStatus !== 'REJECTED' && onboardingStatus !== 'PENDING' && onboardingStatus !== 'AWAITING_APPROVAL' && onboardingUrl && (
            <a
              href={onboardingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:opacity-90"
            >
              Configurar agora →
            </a>
          )}
        </>
      )}
    </div>
  )
}
