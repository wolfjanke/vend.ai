'use client'

import { useState, useEffect, useCallback } from 'react'

interface PdvOrder {
  id:           string
  order_number: string
  customer_name: string
  total:        number
  payment_status: string | null
  payment_method: string | null
  created_at:   string
}

interface Props {
  storeId: string
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(dt: string) {
  return new Date(dt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  CONFIRMED: { label: 'Confirmado', cls: 'text-accent border-accent/30 bg-accent/10' },
  PENDING:   { label: 'Pendente',   cls: 'text-warm border-warm/30 bg-warm/10' },
  FAILED:    { label: 'Falhou',     cls: 'text-warm border-warm/30 bg-warm/10' },
}

export default function PdvHistory({ storeId }: Props) {
  const [orders, setOrders]   = useState<PdvOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate]       = useState(new Date().toISOString().slice(0, 10))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/admin/pdv?date=${date}`)
      const data = await res.json()
      setOrders(data.orders ?? [])
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => { load() }, [load])

  const totalVendido = orders
    .filter(o => o.payment_status === 'CONFIRMED')
    .reduce((acc, o) => acc + Number(o.total), 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <div className="flex-1">
          <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1">Data</label>
          <input
            type="date"
            className="min-h-[44px] px-3 py-2 bg-surface2 border border-border rounded-xl text-sm outline-none focus:border-primary transition-all"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={load}
          className="px-4 py-2 min-h-[44px] border border-border rounded-xl text-sm text-muted hover:text-foreground hover:border-primary/50 transition-all"
        >
          Atualizar
        </button>
      </div>

      {/* Total do dia */}
      <div className="bg-surface border border-accent/30 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-muted mb-0.5">Total vendido (confirmado)</div>
          <div className="font-syne font-extrabold text-xl text-accent tabular-nums">{formatCurrency(totalVendido)}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted mb-0.5">Pedidos PDV</div>
          <div className="font-bold text-lg">{orders.length}</div>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-muted text-sm py-8 animate-pulse">Carregando…</div>
      ) : orders.length === 0 ? (
        <div className="text-center text-muted text-sm py-8">Nenhuma venda PDV nesta data.</div>
      ) : (
        <div className="space-y-2">
          {orders.map(o => {
            const st = STATUS_LABELS[o.payment_status ?? ''] ?? { label: o.payment_status ?? '—', cls: 'text-muted border-border' }
            return (
              <div key={o.id} className="bg-surface border border-border rounded-2xl p-4 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-syne font-bold text-sm">{o.order_number}</div>
                  <div className="text-xs text-muted mt-0.5 truncate">{o.customer_name}</div>
                  <div className="text-[10px] text-muted mt-1">{formatDate(o.created_at)} · {o.payment_method ?? '—'}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-accent tabular-nums">{formatCurrency(Number(o.total))}</div>
                  <span className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${st.cls}`}>
                    {st.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
