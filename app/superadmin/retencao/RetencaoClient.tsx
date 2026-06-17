'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, MessageCircle } from 'lucide-react'
import SuperadminPageHeader from '@/components/superadmin/SuperadminPageHeader'
import StatusBadge from '@/components/superadmin/StatusBadge'
import {
  superadminCard,
  superadminChipActive,
  superadminChipInactive,
  superadminLink,
} from '@/lib/superadmin-ui'
import { RETENTION_BONUS_DAYS, isRetentionQueuePending } from '@/lib/churn-retention'
import { whatsappWaMeDigits, formatPhoneDisplay } from '@/lib/masks'

type RetentionItem = {
  id: string
  name: string
  slug: string
  plan: string
  subscriptionStatus: string | null
  ownerEmail: string | null
  ownerWhatsapp: string | null
  clickedAt: string | null
  grantedAt: string | null
  dismissedAt: string | null
  grantedBy: string | null
  daysRemaining: number | null
}

const FILTERS = ['pending', 'granted', 'dismissed', 'all'] as const
type Filter = typeof FILTERS[number]

const FILTER_LABELS: Record<Filter, string> = {
  pending:   'Pendentes',
  granted:   'Concedidos',
  dismissed: 'Dispensados',
  all:       'Todos',
}

function timeAgo(iso: string | null): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `há ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 48) return `há ${hrs}h`
  return new Date(iso).toLocaleDateString('pt-BR')
}

export default function RetencaoClient() {
  const [filter, setFilter] = useState<Filter>('pending')
  const [items, setItems] = useState<RetentionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setMsg('')
    try {
      const res = await fetch(`/api/superadmin/retencao?filter=${filter}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao carregar')
      setItems(data.items ?? [])
      window.dispatchEvent(new Event('retention-queue-updated'))
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Erro de conexão')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { void load() }, [load])

  async function grant(id: string, name: string) {
    if (!confirm(`Conceder +${RETENTION_BONUS_DAYS} dias para "${name}"?`)) return
    setBusyId(id)
    setMsg('')
    try {
      const res = await fetch(`/api/superadmin/retencao/${id}/grant`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao conceder')
      setMsg(`+${RETENTION_BONUS_DAYS} dias concedidos para ${name}.`)
      await load()
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Erro ao conceder')
    } finally {
      setBusyId(null)
    }
  }

  async function dismiss(id: string, name: string) {
    if (!confirm(`Dispensar "${name}" da fila (sem conceder bônus)?`)) return
    setBusyId(id)
    setMsg('')
    try {
      const res = await fetch(`/api/superadmin/retencao/${id}/dismiss`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao dispensar')
      setMsg(`${name} dispensado da fila.`)
      await load()
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Erro ao dispensar')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="min-w-0 animate-fade-up">
      <SuperadminPageHeader
        title="Retenção"
        description="Lojistas que clicaram em conversar no WhatsApp antes de cancelar"
      />

      <p className="text-sm text-muted mb-4 break-words">
        Conceda +{RETENTION_BONUS_DAYS} dias após conversar no WhatsApp. O sistema registra o clique,
        não a mensagem enviada.
      </p>

      {msg && (
        <p className="mb-4 text-sm px-3 py-2 rounded-xl bg-surface2 border border-border break-words">
          {msg}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map(f => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs min-h-[36px] ${
              filter === f ? superadminChipActive : superadminChipInactive
            }`}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted text-sm animate-pulse">Carregando…</p>
      ) : items.length === 0 ? (
        <div className={`${superadminCard} text-center text-muted text-sm break-words`}>
          {filter === 'pending'
            ? 'Nenhum pedido de retenção pendente.'
            : 'Nenhum registro neste filtro.'}
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map(item => {
            const busy = busyId === item.id
            const waDigits = item.ownerWhatsapp ? whatsappWaMeDigits(item.ownerWhatsapp) : null
            const showActions = isRetentionQueuePending(item)
            return (
              <li key={item.id} className={`${superadminCard} min-w-0`}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/superadmin/clientes/${item.id}`}
                      className={`font-syne font-bold text-base break-words ${superadminLink}`}
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-muted break-all mt-0.5">/{item.slug}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                      <span className="capitalize font-medium">{item.plan}</span>
                      <StatusBadge status={item.subscriptionStatus} />
                      {item.daysRemaining != null && (
                        <span className="text-muted tabular-nums">{item.daysRemaining}d rest.</span>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-muted space-y-1 break-words">
                      {item.ownerEmail && (
                        <p>
                          E-mail:{' '}
                          <a href={`mailto:${item.ownerEmail}`} className="text-primary hover:underline break-all">
                            {item.ownerEmail}
                          </a>
                        </p>
                      )}
                      {waDigits && (
                        <p>
                          WhatsApp:{' '}
                          <a
                            href={`https://wa.me/${waDigits}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline"
                          >
                            {formatPhoneDisplay(item.ownerWhatsapp!)}
                          </a>
                        </p>
                      )}
                      <p>Clicou {timeAgo(item.clickedAt)}</p>
                      {item.grantedAt && (
                        <p className="text-green-400">
                          Concedido {timeAgo(item.grantedAt)}
                          {item.grantedBy ? ` · por ${item.grantedBy}` : ''}
                        </p>
                      )}
                      {item.dismissedAt && (
                        <p className="text-warm">Dispensado {timeAgo(item.dismissedAt)}</p>
                      )}
                    </div>
                  </div>

                  {showActions && (
                    <div className="flex flex-col gap-2 w-full sm:w-auto shrink-0">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void grant(item.id, item.name)}
                        className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {busy ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <>
                            <MessageCircle size={16} aria-hidden />
                            +{RETENTION_BONUS_DAYS} dias
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void dismiss(item.id, item.name)}
                        className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl border border-border text-sm font-semibold text-muted hover:text-warm disabled:opacity-50"
                      >
                        Dispensar
                      </button>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
