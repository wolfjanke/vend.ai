'use client'

import { useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import type { OrderItem } from '@/types'

interface Props {
  orderId: string
  initialItems: OrderItem[]
  initialNotes: string
  onSaved: (items: OrderItem[], notes: string, total: number) => void
  onCancel: () => void
}

function calcTotal(items: OrderItem[]): number {
  return Math.max(0, Number(items.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2)))
}

export default function PedidoQuoteEditor({
  orderId,
  initialItems,
  initialNotes,
  onSaved,
  onCancel,
}: Props) {
  const [items, setItems] = useState<OrderItem[]>(() => initialItems.map(i => ({ ...i })))
  const [notes, setNotes] = useState(initialNotes)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateQty(index: number, qty: number) {
    setItems(prev => prev.map((item, i) => (i === index ? { ...item, qty: Math.max(1, qty) } : item)))
  }

  function removeLine(index: number) {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  async function save() {
    if (items.length === 0) {
      setError('O orçamento precisa ter pelo menos um item.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/pedidos/${orderId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ items, notes }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'Não foi possível salvar.')
        return
      }
      onSaved(items, notes, Number(data.total ?? calcTotal(items)))
    } catch {
      setError('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  const total = calcTotal(items)

  return (
    <div className="mb-3 p-3 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
      <p className="text-xs font-semibold text-foreground">Editar orçamento</p>
      <p className="text-[11px] text-muted leading-relaxed">
        Ajuste quantidades ou remova itens antes de confirmar o pagamento com o cliente.
      </p>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={`${item.product_id}-${item.variant_id}-${item.size}-${index}`} className="flex gap-2 items-start min-w-0">
            <div className="flex-1 min-w-0 text-xs text-muted break-words">
              {item.name}
              {item.color ? ` — ${item.color}` : ''} · {item.size}
              <div className="text-[10px] mt-0.5 tabular-nums">
                R${item.price.toFixed(2).replace('.', ',')} un.
              </div>
            </div>
            <input
              type="number"
              min={1}
              inputMode="numeric"
              className="w-14 min-h-[40px] px-2 py-1.5 bg-surface2 border border-border rounded-lg text-sm text-center"
              value={item.qty}
              onChange={e => updateQty(index, parseInt(e.target.value, 10) || 1)}
            />
            <button
              type="button"
              onClick={() => removeLine(index)}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg border border-warm/30 text-warm hover:bg-warm/10"
              aria-label="Remover item"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <p className="text-xs text-warm">Nenhum item — adicione pelo menos um para salvar.</p>
      )}

      <textarea
        className="w-full min-h-[72px] px-3 py-2.5 bg-surface2 border border-border rounded-xl text-sm resize-y"
        placeholder="Observações do orçamento"
        value={notes}
        onChange={e => setNotes(e.target.value)}
      />

      <div className="flex items-center justify-between text-sm font-semibold tabular-nums">
        <span className="text-muted">Total estimado</span>
        <span className="text-accent">R${total.toFixed(2).replace('.', ',')}</span>
      </div>

      {error && <p className="text-xs text-warm break-words">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-3 py-2 min-h-[40px] rounded-lg border border-border text-xs font-semibold text-muted hover:text-foreground disabled:opacity-50"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={save}
          disabled={loading || items.length === 0}
          className="px-3 py-2 min-h-[40px] rounded-lg border border-primary text-primary text-xs font-semibold hover:bg-primary/20 disabled:opacity-50 inline-flex items-center gap-1.5"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : null}
          Salvar orçamento
        </button>
      </div>
    </div>
  )
}
