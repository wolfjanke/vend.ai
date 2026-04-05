'use client'

import { useState, useEffect, useCallback } from 'react'

interface Summary {
  gmv_total:   number
  fee_total:   number
  order_count: number
}

interface BySource {
  payment_source: string
  gmv:   number
  fee:   number
  count: number
}

interface BySplitStatus {
  split_status: string
  gmv:   number
  count: number
}

interface FinanceiroData {
  period:        { from: string; to: string }
  summary:       Summary
  bySource:      BySource[]
  bySplitStatus: BySplitStatus[]
}

interface Props {
  plan: string
}

function formatCurrency(v: number) {
  return (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const SOURCE_LABELS: Record<string, string> = {
  CHECKOUT: '🌐 Site',
  PDV:      '🛒 PDV',
}

const SPLIT_LABELS: Record<string, { label: string; cls: string }> = {
  DONE:      { label: 'Repassado',  cls: 'text-accent border-accent/30 bg-accent/10' },
  PENDING:   { label: 'Pendente',   cls: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' },
  CANCELLED: { label: 'Cancelado',  cls: 'text-warm border-warm/30 bg-warm/10' },
  REFUSED:   { label: 'Recusado',   cls: 'text-warm border-warm/30 bg-warm/10' },
}

export default function FinanceiroClient({ plan }: Props) {
  const now      = new Date()
  const year     = now.getFullYear()
  const month    = (now.getMonth() + 1).toString().padStart(2, '0')
  const firstDay = `${year}-${month}-01`
  const today    = now.toISOString().slice(0, 10)

  const [from, setFrom] = useState(firstDay)
  const [to, setTo]     = useState(today)
  const [data, setData] = useState<FinanceiroData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/admin/financeiro?from=${from}&to=${to}`)
      const json = await res.json()
      setData(json)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [from, to])

  useEffect(() => { load() }, [load])

  const merchantPct = plan === 'loja' ? 98.3 : plan === 'pro' ? 97.5 : plan === 'starter' ? 96.0 : 95.5

  return (
    <div className="space-y-5">
      {/* Filtro de período */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <div className="font-syne font-bold text-sm mb-3">Período</div>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="flex-1">
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">De</label>
            <input type="date" className="w-full min-h-[44px] px-3 py-2 bg-surface2 border border-border rounded-xl text-sm outline-none focus:border-primary transition-all" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div className="flex-1">
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">Até</label>
            <input type="date" className="w-full min-h-[44px] px-3 py-2 bg-surface2 border border-border rounded-xl text-sm outline-none focus:border-primary transition-all" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <button type="button" onClick={load} className="px-4 py-2 min-h-[44px] bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shrink-0">
            Filtrar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-muted text-sm py-10 animate-pulse">Carregando…</div>
      ) : !data ? (
        <div className="text-center text-warm text-sm py-10">Erro ao carregar dados.</div>
      ) : (
        <>
          {/* Resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-surface border border-accent/30 rounded-2xl p-4 text-center">
              <div className="text-xs text-muted mb-1">GMV total</div>
              <div className="font-syne font-extrabold text-xl text-accent tabular-nums">{formatCurrency(data.summary.gmv_total)}</div>
              <div className="text-[10px] text-muted mt-1">{data.summary.order_count} pedidos</div>
            </div>
            <div className="bg-surface border border-border rounded-2xl p-4 text-center">
              <div className="text-xs text-muted mb-1">Taxa plataforma</div>
              <div className="font-syne font-extrabold text-xl tabular-nums">{formatCurrency(data.summary.fee_total)}</div>
              <div className="text-[10px] text-muted mt-1">Você retém ~{merchantPct}%</div>
            </div>
            <div className="bg-surface border border-border rounded-2xl p-4 text-center">
              <div className="text-xs text-muted mb-1">Estimativa líquida</div>
              <div className="font-syne font-extrabold text-xl text-accent tabular-nums">
                {formatCurrency(data.summary.gmv_total - data.summary.fee_total)}
              </div>
              <div className="text-[10px] text-muted mt-1">GMV − taxa</div>
            </div>
          </div>

          {/* Por origem */}
          {data.bySource.length > 0 && (
            <div className="bg-surface border border-border rounded-2xl p-4">
              <div className="font-syne font-bold text-sm mb-3">Por canal de venda</div>
              <div className="space-y-2">
                {data.bySource.map(s => (
                  <div key={s.payment_source} className="flex items-center justify-between text-sm gap-3">
                    <span className="text-muted shrink-0">{SOURCE_LABELS[s.payment_source] ?? s.payment_source}</span>
                    <div className="flex-1 border-b border-border border-dashed mx-2" />
                    <span className="tabular-nums font-semibold shrink-0">{formatCurrency(s.gmv)}</span>
                    <span className="text-muted text-xs tabular-nums shrink-0">({s.count})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Por status de split */}
          {data.bySplitStatus.length > 0 && (
            <div className="bg-surface border border-border rounded-2xl p-4">
              <div className="font-syne font-bold text-sm mb-3">Status de repasse</div>
              <div className="space-y-2">
                {data.bySplitStatus.map(s => {
                  const st = SPLIT_LABELS[s.split_status] ?? { label: s.split_status, cls: 'text-muted border-border' }
                  return (
                    <div key={s.split_status} className="flex items-center justify-between text-sm gap-3">
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${st.cls}`}>
                        {st.label}
                      </span>
                      <div className="flex-1 border-b border-border border-dashed mx-2" />
                      <span className="tabular-nums font-semibold shrink-0">{formatCurrency(s.gmv)}</span>
                      <span className="text-muted text-xs tabular-nums shrink-0">({s.count})</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {data.summary.order_count === 0 && (
            <div className="text-center text-muted text-sm py-10">
              Nenhuma venda processada pelo checkout ou PDV neste período.
              <br />
              <span className="text-xs">Vendas pelo WhatsApp não aparecem no extrato financeiro.</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
