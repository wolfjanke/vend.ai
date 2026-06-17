'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Crown, X } from 'lucide-react'
import {
  formatPlanPrice,
  formatBillingCycleLabel,
  formatBillingPeriodNoun,
  getDailyCentsFromCharge,
  PLAN_FEATURE_LINES,
  type BillingCycle,
  type PlanSlug,
} from '@/lib/plans'
import { adminCard } from '@/lib/admin-ui'
import type { SubscriptionStatus } from '@/types'
import BillingOwnerForm from '@/components/admin/BillingOwnerForm'
import BillingCycleToggle from '@/components/admin/BillingCycleToggle'
import CancelRetentionModal from '@/components/admin/CancelRetentionModal'
import {
  isRetentionOfferEligible,
} from '@/lib/churn-retention'
import type { BillingOwnerInput } from '@/lib/validations'

interface PlanBilling {
  displayMonthlyCents: number
  chargeAmountCents: number
}

interface PlanOption {
  slug: PlanSlug
  name: string
  priceCents: number
  trialDays: number
  billing: Record<BillingCycle, PlanBilling>
}

interface BillingRow {
  id: string
  type: string
  plan: string | null
  amount_cents: number
  description: string | null
  created_at: string
}

interface BillingOwnerData {
  hasBillingDoc:      boolean
  type:               'pf' | 'pj' | null
  docMasked:          string | null
  legalName:          string | null
  addressFilled:      boolean
  ownerEmail:         string | null
  ownerPhone:         string | null
  defaultHolderName:  string
}

interface PlanoClientProps {
  ownerName?: string
  storeName?: string
}
interface SubscriptionData {
  plan: PlanSlug
  subscriptionStatus: SubscriptionStatus | null
  subscriptionEndsAt: string | null
  trialEndsAt: string | null
  trialDaysRemaining: number | null
  nextChargeAt: string | null
  billingCycle: BillingCycle
  paymentsConfigured: boolean
  billingTestAllowed: boolean
  usage: {
    productCount: number
    productLimit: number | null
    viMessagesUsed: number
    viMessagesLimit: number
    viOverageMessages: number
  }
  plans: PlanOption[]
  billingHistory: BillingRow[]
  isDemoStore?: boolean
  billingExempt?: boolean
  retentionBonusGrantedAt?: string | null
}

const STATUS_LABELS: Record<string, string> = {
  TRIAL: 'Trial',
  ACTIVE: 'Ativo',
  OVERDUE: 'Vencido',
  CANCELLED: 'Cancelado',
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

function formatDaily(cents: number): string {
  if (cents < 100) return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`
  return formatPlanPrice(cents)
}

export default function PlanoClient({ ownerName = '', storeName = '' }: PlanoClientProps) {
  const [data, setData] = useState<SubscriptionData | null>(null)
  const [billingOwner, setBillingOwner] = useState<BillingOwnerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const [billingModalPlan, setBillingModalPlan] = useState<PlanSlug | null>(null)
  const [showCancelRetention, setShowCancelRetention] = useState(false)
  const [retentionError, setRetentionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [subRes, billingRes] = await Promise.all([
        fetch('/api/admin/subscription'),
        fetch('/api/admin/billing-owner'),
      ])
      if (!subRes.ok) {
        const j = await subRes.json().catch(() => ({}))
        setError((j as { error?: string }).error ?? 'Erro ao carregar plano')
        setData(null)
        return
      }
      const json = await subRes.json() as SubscriptionData
      setData({
        ...json,
        billingTestAllowed: json.billingTestAllowed ?? true,
      })
      setBillingCycle(json.billingCycle ?? 'monthly')

      if (billingRes.ok) {
        setBillingOwner(await billingRes.json() as BillingOwnerData)
      }
    } catch {
      setError('Erro de conexão')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleUpgrade(plan: PlanSlug, billing?: BillingOwnerInput) {
    setBusy(plan)
    setError(null)
    try {
      const res = await fetch('/api/admin/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          billingCycle,
          action: data?.subscriptionStatus && data.subscriptionStatus !== 'CANCELLED' ? 'upgrade' : 'create',
          ...(billing ? { billing } : {}),
        }),
      })
      const j = await res.json()
      if (!res.ok) {
        throw new Error((j as { error?: string }).error ?? 'Não foi possível alterar o plano')
      }
      setBillingModalPlan(null)
      await load()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro de conexão'
      setError(msg)
      throw err
    } finally {
      setBusy(null)
    }
  }

  function requestUpgrade(plan: PlanSlug) {
    if (billingOwner?.hasBillingDoc) {
      void handleUpgrade(plan)
      return
    }
    setBillingModalPlan(plan)
  }

  async function handleBillingSubmit(billing: BillingOwnerInput) {
    const plan = billingModalPlan
    if (!plan) return
    await handleUpgrade(plan, billing)
  }

  function requestCancel() {
    if (!data) return
    const eligible = isRetentionOfferEligible({
      storeName,
      plan: data.plan,
      subscriptionStatus: data.subscriptionStatus,
      billingExempt: data.billingExempt,
      retentionBonusGrantedAt: data.retentionBonusGrantedAt,
    })
    if (eligible) {
      setRetentionError(null)
      setShowCancelRetention(true)
      return
    }
    void executeCancel()
  }

  async function openRetentionWhatsApp() {
    if (!data) return
    setRetentionError(null)
    try {
      const res = await fetch('/api/admin/subscription/retention-click', { method: 'POST' })
      const j = await res.json() as { whatsAppUrl?: string; error?: string }
      if (!res.ok) {
        setRetentionError(j.error ?? 'Não foi possível registrar. Tente novamente.')
        return
      }
      if (!j.whatsAppUrl) {
        setRetentionError('Link do WhatsApp indisponível. Tente novamente.')
        return
      }
      window.open(j.whatsAppUrl, '_blank', 'noopener,noreferrer')
      setShowCancelRetention(false)
      setRetentionError(null)
    } catch {
      setRetentionError('Erro de conexão. Verifique a internet e tente novamente.')
    }
  }

  async function executeCancel() {
    setShowCancelRetention(false)
    setBusy('cancel')
    setError(null)
    try {
      const res = await fetch('/api/admin/subscription', { method: 'DELETE' })
      const j = await res.json()
      if (!res.ok) {
        setError(j.error ?? 'Erro ao cancelar')
        return
      }
      await load()
    } catch {
      setError('Erro de conexão')
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return <div className="text-center text-muted text-sm py-10 animate-pulse">Carregando plano…</div>
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-warm/30 bg-warm/10 px-4 py-3 text-sm text-warm break-words">
        {error ?? 'Não foi possível carregar o plano.'}
      </div>
    )
  }

  const currentPlan = data.plans.find(p => p.slug === data.plan) ?? null
  const isPaid = data.plan !== 'free'
  const statusLabel = data.subscriptionStatus
    ? STATUS_LABELS[data.subscriptionStatus] ?? data.subscriptionStatus
    : isPaid ? 'Ativo' : 'Grátis'

  const currentBilling = currentPlan?.billing[data.billingCycle]
  const currentDisplayMonthly = currentBilling?.displayMonthlyCents ?? currentPlan?.priceCents ?? 0

  const planDisplayName =
    data.plan === 'free' ? 'Grátis' : data.plan.charAt(0).toUpperCase() + data.plan.slice(1)
  const compactPlanLine = [
    planDisplayName,
    isPaid && currentPlan ? `${formatPlanPrice(currentDisplayMonthly)}/mês` : null,
    statusLabel,
  ]
    .filter(Boolean)
    .join(' · ')

  const currentPlanBody = (
    <>
      {data.billingExempt && (
        <div className="mb-4 rounded-xl border border-warm/30 bg-warm/10 px-4 py-3 text-sm text-warm break-words">
          Loja de demonstração da plataforma — todos os recursos liberados, sem cobrança de assinatura.
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-muted text-xs mb-0.5">Plano</div>
          <div className="font-semibold capitalize">{data.plan === 'free' ? 'Grátis' : data.plan}</div>
        </div>
        <div>
          <div className="text-muted text-xs mb-0.5">Status</div>
          <div className="font-semibold">{statusLabel}</div>
        </div>
        {isPaid && currentPlan && (
          <>
            <div>
              <div className="text-muted text-xs mb-0.5">Valor mensal</div>
              <div className="font-semibold tabular-nums">{formatPlanPrice(currentDisplayMonthly)}</div>
            </div>
            <div>
              <div className="text-muted text-xs mb-0.5">Ciclo</div>
              <div className="font-semibold break-words">{formatBillingCycleLabel(data.billingCycle)}</div>
            </div>
          </>
        )}
        <div>
          <div className="text-muted text-xs mb-0.5">
            {data.subscriptionStatus === 'TRIAL' ? 'Primeira cobrança' : 'Renovação'}
          </div>
          <div className="tabular-nums">
            {formatDate(data.subscriptionStatus === 'TRIAL' ? data.nextChargeAt : data.subscriptionEndsAt)}
          </div>
        </div>
      </div>

      {data.subscriptionStatus === 'TRIAL' && data.trialDaysRemaining != null && (
        <p className="mt-3 text-sm text-accent font-medium break-words">
          Trial — {data.trialDaysRemaining}{' '}
          {data.trialDaysRemaining === 1 ? 'dia restante' : 'dias restantes'}
          {data.nextChargeAt && (
            <span className="text-muted font-normal">
              {' '}· 1ª cobrança em {formatDate(data.nextChargeAt)}
            </span>
          )}
        </p>
      )}

      <div className="mt-4 pt-4 border-t border-border space-y-2 text-sm">
        <div className="flex justify-between gap-2 min-w-0">
          <span className="text-muted shrink-0">Produtos ativos</span>
          <span className="tabular-nums shrink-0 text-right">
            {data.usage.productCount}
            {data.usage.productLimit != null ? ` / ${data.usage.productLimit}` : ' / ∞'}
          </span>
        </div>
        <div className="flex justify-between gap-2 min-w-0">
          <span
            className="text-muted min-w-0 break-words"
            title="Mensagens Assistente IA (mês)"
          >
            <span className="sm:hidden">Msgs Vi (mês)</span>
            <span className="hidden sm:inline">Mensagens Assistente IA (mês)</span>
          </span>
          <span className="tabular-nums shrink-0 text-right">
            {data.usage.viMessagesUsed.toLocaleString('pt-BR')} /{' '}
            {data.usage.viMessagesLimit.toLocaleString('pt-BR')}
          </span>
        </div>
        {data.usage.viOverageMessages > 0 && (
          <div className="flex justify-between gap-2 text-yellow-400 min-w-0">
            <span className="break-words">Excedente Assistente IA</span>
            <span className="tabular-nums shrink-0">
              {data.usage.viOverageMessages.toLocaleString('pt-BR')}
            </span>
          </div>
        )}
      </div>

      {isPaid && data.subscriptionStatus !== 'CANCELLED' && !data.billingExempt && (
        <button
          type="button"
          onClick={requestCancel}
          disabled={!!busy}
          className="mt-4 w-full min-h-[44px] px-4 py-2 rounded-xl border border-warm/40 text-warm text-sm font-semibold hover:bg-warm/10 disabled:opacity-50"
        >
          {busy === 'cancel' ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Cancelar plano'}
        </button>
      )}
    </>
  )

  return (
    <div className="space-y-5 min-w-0">
      {error && (
        <div className="rounded-xl border border-warm/30 bg-warm/10 px-4 py-3 text-sm text-warm break-words">
          {error}
        </div>
      )}

      <p className="md:hidden text-sm text-foreground break-words rounded-xl border border-border bg-surface2/40 px-4 py-3">
        <span className="text-muted text-xs block mb-0.5">Seu plano</span>
        <span className="font-semibold">{compactPlanLine}</span>
      </p>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
      {/* Plano atual — mobile colapsável */}
      <details className={`md:hidden ${adminCard} border-primary/30 group`}>
        <summary className="list-none cursor-pointer flex items-center gap-2 min-h-[44px] [&::-webkit-details-marker]:hidden">
          <Crown size={18} className="text-primary shrink-0" aria-hidden />
          <span className="font-syne font-bold text-base min-w-0 truncate flex-1">Plano atual</span>
          <span className="text-xs text-primary font-semibold shrink-0 group-open:hidden">Expandir</span>
          <span className="text-xs text-muted font-semibold shrink-0 hidden group-open:inline">Recolher</span>
        </summary>
        <div className="pt-3 border-t border-border mt-2">{currentPlanBody}</div>
      </details>

      {/* Plano atual — desktop */}
      <div className={`hidden md:block ${adminCard} xl:col-span-4 xl:sticky xl:top-24 h-fit border-primary/30`}>
        <div className="flex items-center gap-2 mb-3">
          <Crown size={18} className="text-primary shrink-0" />
          <span className="font-syne font-bold text-base">Plano atual</span>
        </div>
        {currentPlanBody}
      </div>

      {/* Grid de planos */}
      {!data.billingExempt && (
      <div className="xl:col-span-8 space-y-5">
      <div>
        <h2 className="font-syne font-bold text-sm mb-3">Planos disponíveis</h2>

        <BillingCycleToggle value={billingCycle} onChange={setBillingCycle} />

        <div className="grid w-full gap-3 grid-cols-1 sm:grid-cols-2">
          {data.plans.map(p => {
            const isCurrent = p.slug === data.plan && isPaid
            const isPopular = p.slug === 'pro'
            const cyclePricing = p.billing[billingCycle]
            const displayMonthly = cyclePricing.displayMonthlyCents
            const chargeAmount = cyclePricing.chargeAmountCents
            const periodNoun = formatBillingPeriodNoun(billingCycle)
            const dailyCents = getDailyCentsFromCharge(chargeAmount, billingCycle)

            return (
              <div
                key={p.slug}
                className={`${adminCard} flex flex-col min-w-0 ${
                  isPopular ? 'border-primary/50 ring-1 ring-primary/20' : ''
                }`}
              >
                {isPopular && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-primary mb-2">
                    Mais popular
                  </span>
                )}
                <div className="font-syne font-bold capitalize mb-1">{p.name}</div>
                {p.trialDays > 0 && (
                  <p className="text-xs text-accent font-semibold mb-1">
                    {p.trialDays} dias grátis na 1ª assinatura
                  </p>
                )}
                <div className="text-base sm:text-lg font-extrabold tabular-nums mb-1 min-w-0 truncate">
                  {formatPlanPrice(displayMonthly)}
                  <span className="text-xs font-normal text-muted">/mês</span>
                </div>
                {billingCycle !== 'monthly' && (
                  <p className="text-xs text-muted mb-2 break-words">
                    Cobrado {formatPlanPrice(chargeAmount)} por {periodNoun}
                  </p>
                )}
                <p className="text-[11px] text-muted mb-3 break-words">
                  Equivale a {formatDaily(dailyCents)}/dia
                </p>

                <ul className="flex flex-col gap-1.5 mb-4 text-xs text-muted flex-1 min-w-0">
                  {PLAN_FEATURE_LINES[p.slug].map(line => (
                    <li key={line} className="break-words leading-snug">• {line}</li>
                  ))}
                </ul>

                <button
                  type="button"
                  disabled={(isCurrent && data.billingCycle === billingCycle) || !!busy || !data.paymentsConfigured || !data.billingTestAllowed}
                  onClick={() => requestUpgrade(p.slug)}
                  className="mt-auto w-full min-h-[44px] px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {busy === p.slug ? (
                    <Loader2 size={16} className="animate-spin mx-auto" />
                  ) : isCurrent && data.billingCycle === billingCycle ? (
                    'Plano atual'
                  ) : (
                    'Fazer upgrade'
                  )}
                </button>
              </div>
            )
          })}
        </div>
        {!data.paymentsConfigured && (
          <p className="text-xs text-muted mt-3 break-words">
            Configure as chaves do Asaas no ambiente para ativar upgrades e cobranças.
          </p>
        )}
        {data.paymentsConfigured && !data.billingTestAllowed && (
          <p className="text-xs text-warm mt-3 break-words">
            Seu e-mail ainda não está na lista de teste do sandbox (BILLING_TEST_EMAILS).
          </p>
        )}
        {data.paymentsConfigured && data.billingTestAllowed && (
          <p className="text-xs text-accent mt-3 break-words">
            Conta liberada para teste de assinatura no sandbox.
          </p>
        )}
      </div>

      {/* Histórico */}
      <div>
        <button
          type="button"
          onClick={() => setShowHistory(v => !v)}
          className="text-sm text-primary font-semibold hover:underline min-h-[44px]"
        >
          {showHistory ? 'Ocultar histórico' : 'Ver histórico de cobranças'}
        </button>
        {showHistory && (
          <div className="mt-3 bg-surface border border-border rounded-2xl overflow-hidden">
            {data.billingHistory.length === 0 ? (
              <p className="text-sm text-muted p-4">Nenhuma cobrança registrada ainda.</p>
            ) : (
              <ul className="divide-y divide-border">
                {data.billingHistory.map(row => (
                  <li key={row.id} className="px-4 py-3 text-sm flex flex-col gap-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <span className="font-medium truncate">{row.description ?? row.type}</span>
                      <span className="tabular-nums shrink-0">
                        R$ {(row.amount_cents / 100).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <span className="text-xs text-muted">{formatDate(row.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      </div>
      )}
      </div>

      {showCancelRetention && data && (
        <CancelRetentionModal
          storeName={storeName}
          plan={data.plan}
          busy={busy === 'cancel'}
          error={retentionError}
          onWhatsApp={openRetentionWhatsApp}
          onContinueCancel={() => void executeCancel()}
          onClose={() => {
            setShowCancelRetention(false)
            setRetentionError(null)
          }}
        />
      )}

      {billingModalPlan && (
        <div
          className="fixed inset-0 z-[500] bg-bg/80 flex items-end sm:items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="billing-modal-title"
        >
          <div className="bg-surface border border-border rounded-2xl p-5 w-full max-w-lg max-h-[calc(100vh-32px)] overflow-y-auto shadow-xl max-w-[calc(100vw-32px)] sm:max-w-lg">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <h3 id="billing-modal-title" className="font-syne font-bold text-lg break-words">
                  Dados para cobrança
                </h3>
                <p className="text-xs text-muted mt-1 break-words">
                  O Asaas exige CPF ou CNPJ antes de criar a assinatura do plano{' '}
                  <span className="capitalize font-medium">{billingModalPlan}</span>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBillingModalPlan(null)}
                className="shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-border text-muted hover:text-foreground"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>
            <BillingOwnerForm
              defaultHolderName={ownerName}
              initial={{
                type: billingOwner?.type ?? undefined,
                legalName: billingOwner?.legalName,
              }}
              submitLabel="Salvar e fazer upgrade"
              loading={!!busy}
              onSubmit={handleBillingSubmit}
            />
          </div>
        </div>
      )}
    </div>
  )
}
