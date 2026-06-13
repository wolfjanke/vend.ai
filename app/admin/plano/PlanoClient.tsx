'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Crown } from 'lucide-react'
import { formatPlanPrice } from '@/lib/plans'
import { adminCard } from '@/lib/admin-ui'
import type { PlanSlug, SubscriptionStatus } from '@/types'

interface PlanOption {
  slug: PlanSlug
  name: string
  priceCents: number
}

interface BillingRow {
  id: string
  type: string
  plan: string | null
  amount_cents: number
  description: string | null
  created_at: string
}

interface SubscriptionData {
  plan: PlanSlug
  subscriptionStatus: SubscriptionStatus | null
  subscriptionEndsAt: string | null
  trialEndsAt: string | null
  trialDaysRemaining: number | null
  paymentsConfigured: boolean
  usage: {
    productCount: number
    productLimit: number | null
    viMessagesUsed: number
    viMessagesLimit: number
    viOverageMessages: number
  }
  plans: PlanOption[]
  billingHistory: BillingRow[]
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

export default function PlanoClient() {
  const [data, setData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/subscription')
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError((j as { error?: string }).error ?? 'Erro ao carregar plano')
        setData(null)
        return
      }
      setData(await res.json())
    } catch {
      setError('Erro de conexão')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleUpgrade(plan: PlanSlug) {
    setBusy(plan)
    setError(null)
    try {
      const res = await fetch('/api/admin/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          action: data?.subscriptionStatus && data.subscriptionStatus !== 'CANCELLED' ? 'upgrade' : 'create',
        }),
      })
      const j = await res.json()
      if (!res.ok) {
        setError(j.error ?? 'Não foi possível alterar o plano')
        return
      }
      await load()
    } catch {
      setError('Erro de conexão')
    } finally {
      setBusy(null)
    }
  }

  async function handleCancel() {
    if (!confirm('Cancelar assinatura e voltar ao plano grátis?')) return
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

  return (
    <div className="space-y-5 min-w-0">
      {error && (
        <div className="rounded-xl border border-warm/30 bg-warm/10 px-4 py-3 text-sm text-warm break-words">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
      {/* Plano atual */}
      <div className={`${adminCard} xl:col-span-4 xl:sticky xl:top-24 h-fit border-primary/30`}>
        <div className="flex items-center gap-2 mb-3">
          <Crown size={18} className="text-primary shrink-0" />
          <span className="font-syne font-bold text-base">Plano atual</span>
        </div>
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
            <div>
              <div className="text-muted text-xs mb-0.5">Valor mensal</div>
              <div className="font-semibold tabular-nums">{formatPlanPrice(currentPlan.priceCents)}</div>
            </div>
          )}
          <div>
            <div className="text-muted text-xs mb-0.5">Renovação</div>
            <div className="tabular-nums">{formatDate(data.subscriptionEndsAt)}</div>
          </div>
        </div>

        {data.subscriptionStatus === 'TRIAL' && data.trialDaysRemaining != null && (
          <p className="mt-3 text-sm text-accent font-medium">
            Trial — {data.trialDaysRemaining} {data.trialDaysRemaining === 1 ? 'dia restante' : 'dias restantes'}
          </p>
        )}

        <div className="mt-4 pt-4 border-t border-border space-y-2 text-sm">
          <div className="flex justify-between gap-2">
            <span className="text-muted">Produtos ativos</span>
            <span className="tabular-nums shrink-0">
              {data.usage.productCount}
              {data.usage.productLimit != null ? ` / ${data.usage.productLimit}` : ' / ∞'}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted">Mensagens Assistente IA (mês)</span>
            <span className="tabular-nums shrink-0">
              {data.usage.viMessagesUsed.toLocaleString('pt-BR')} / {data.usage.viMessagesLimit.toLocaleString('pt-BR')}
            </span>
          </div>
          {data.usage.viOverageMessages > 0 && (
            <div className="flex justify-between gap-2 text-yellow-400">
              <span>Excedente Assistente IA</span>
              <span className="tabular-nums">{data.usage.viOverageMessages.toLocaleString('pt-BR')}</span>
            </div>
          )}
        </div>

        {isPaid && data.subscriptionStatus !== 'CANCELLED' && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={!!busy}
            className="mt-4 w-full min-h-[44px] px-4 py-2 rounded-xl border border-warm/40 text-warm text-sm font-semibold hover:bg-warm/10 disabled:opacity-50"
          >
            {busy === 'cancel' ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Cancelar plano'}
          </button>
        )}
      </div>

      {/* Grid de planos */}
      <div className="xl:col-span-8 space-y-5">
      <div>
        <h2 className="font-syne font-bold text-sm mb-3">Planos disponíveis</h2>
        <div className="grid w-full gap-3 grid-cols-1 sm:grid-cols-2">
          {data.plans.map(p => {
            const isCurrent = p.slug === data.plan
            const isPopular = p.slug === 'pro'
            return (
              <div
                key={p.slug}
                className={`${adminCard} flex flex-col ${
                  isPopular ? 'border-primary/50 ring-1 ring-primary/20' : ''
                }`}
              >
                {isPopular && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-primary mb-2">
                    Mais popular
                  </span>
                )}
                <div className="font-syne font-bold capitalize mb-1">{p.name}</div>
                <div className="text-lg font-extrabold tabular-nums mb-3">
                  {formatPlanPrice(p.priceCents)}
                  <span className="text-xs font-normal text-muted">/mês</span>
                </div>
                <button
                  type="button"
                  disabled={isCurrent || !!busy || !data.paymentsConfigured}
                  onClick={() => handleUpgrade(p.slug)}
                  className="mt-auto w-full min-h-[44px] px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {busy === p.slug ? (
                    <Loader2 size={16} className="animate-spin mx-auto" />
                  ) : isCurrent ? (
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
      </div>
    </div>
  )
}
