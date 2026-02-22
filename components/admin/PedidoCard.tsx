'use client'

import { useState, useTransition } from 'react'
import type { Order, OrderStatus } from '@/types'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types'
import { updateOrderStatus } from '@/app/admin/actions'

interface Props {
  order:   Order
  storeId: string
}

const NEXT_ACTIONS: Record<OrderStatus, Array<{ status: OrderStatus; label: string; cls: string }>> = {
  NOVO:       [{ status: 'CONFIRMADO', label: '✅ Confirmar',  cls: 'text-primary border-primary/40 hover:bg-primary/20' }, { status: 'CANCELADO', label: '❌ Cancelar', cls: 'text-warm border-warm/40 hover:bg-warm/10' }],
  CONFIRMADO: [{ status: 'EM_ENTREGA', label: '🚚 Em Entrega', cls: 'text-yellow-400 border-yellow-400/40 hover:bg-yellow-400/10' }, { status: 'CANCELADO', label: '❌ Cancelar', cls: 'text-warm border-warm/40 hover:bg-warm/10' }],
  EM_ENTREGA: [{ status: 'ENTREGUE',   label: '✔️ Entregue',   cls: 'text-accent border-accent/40 hover:bg-accent/10' }],
  ENTREGUE:   [],
  CANCELADO:  [],
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1)  return 'agora'
  if (mins < 60) return `há ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `há ${hrs}h`
  return `há ${Math.floor(hrs / 24)}d`
}

export default function PedidoCard({ order }: Props) {
  const [status,   setStatus]   = useState<OrderStatus>(order.status)
  const [pending,  startTransition] = useTransition()

  function handleAction(nextStatus: OrderStatus) {
    startTransition(async () => {
      await updateOrderStatus(order.id, nextStatus)
      setStatus(nextStatus)
    })
  }

  const actions = NEXT_ACTIONS[status]

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all">
      {/* Top */}
      <div className="flex items-start justify-between mb-3">
        <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-1 rounded-lg">#{order.order_number}</span>
        <span className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border ${ORDER_STATUS_COLORS[status]}`}>
          {ORDER_STATUS_LABELS[status]}
        </span>
      </div>

      {/* Customer */}
      <div className="mb-1 font-semibold text-sm">{order.customer_name}</div>
      <a
        href={`https://wa.me/${order.customer_whatsapp}`}
        target="_blank" rel="noreferrer"
        className="text-accent text-xs mb-3 block hover:underline"
      >
        📱 {order.customer_whatsapp}
      </a>

      {/* Items */}
      <div className="text-muted text-xs mb-3 leading-relaxed">
        {order.items_json.map((item, i) => (
          <div key={i}>• {item.name}{item.color ? ` — ${item.color}` : ''} — {item.size} ({item.qty}x) — R${item.price.toFixed(2).replace('.', ',')}</div>
        ))}
      </div>

      {/* Bottom */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-accent font-bold text-base">R${order.total.toFixed(2).replace('.', ',')}</span>
        <span className="text-muted text-[11px]">{timeAgo(order.created_at)}</span>
      </div>

      {/* Actions */}
      {actions.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {actions.map(action => (
            <button
              key={action.status}
              onClick={() => handleAction(action.status)}
              disabled={pending}
              className={`px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition-all disabled:opacity-50 ${action.cls}`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {(status === 'ENTREGUE' || status === 'CANCELADO') && (
        <span className="text-xs text-muted">Pedido finalizado</span>
      )}
    </div>
  )
}
