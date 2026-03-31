'use client'

import { useState, useTransition } from 'react'
import type { DeliveryAddress, Order, OrderStatus } from '@/types'
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

function parseDelivery(raw: Order['delivery_address']): DeliveryAddress | null {
  if (raw == null) return null
  if (typeof raw === 'object' && raw !== null && 'cep' in raw) return raw as DeliveryAddress
  try {
    return JSON.parse(String(raw)) as DeliveryAddress
  } catch {
    return null
  }
}

export default function PedidoCard({ order }: Props) {
  const [status,   setStatus]   = useState<OrderStatus>(order.status)
  const [pending,  startTransition] = useTransition()
  const delivery = parseDelivery(order.delivery_address)

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

      {delivery && (
        <div className="text-muted text-xs mb-3 leading-relaxed break-words">
          📍 {delivery.logradouro}, {delivery.numero}
          {delivery.complemento ? ` — ${delivery.complemento}` : ''}
          <br />
          {delivery.bairro} — {delivery.cidade}/{delivery.uf} · CEP {delivery.cep}
        </div>
      )}

      {order.notes?.trim() && (
        <div className="text-muted text-xs mb-3 italic">Obs: {order.notes.trim()}</div>
      )}

      <div className="text-xs text-muted mb-3 space-y-1">
        <div className="flex items-center justify-between">
          <span>Subtotal</span>
          <span>R${Number(order.subtotal ?? order.total).toFixed(2).replace('.', ',')}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Desconto cupom</span>
          <span>- R${Number(order.discount_coupon ?? 0).toFixed(2).replace('.', ',')}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Desconto PIX</span>
          <span>- R${Number(order.discount_pix ?? 0).toFixed(2).replace('.', ',')}</span>
        </div>
        <div className="flex items-center justify-between text-foreground">
          <span>Pagamento</span>
          <span>{order.payment_method === 'PIX' ? 'PIX' : 'Outro'}</span>
        </div>
        <div className="flex items-center justify-between text-foreground break-all">
          <span>Cupom</span>
          <span>{order.coupon_code_applied ?? '—'}</span>
        </div>
      </div>

      {/* Bottom */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-accent font-bold text-base">R${Number(order.total_final ?? order.total).toFixed(2).replace('.', ',')}</span>
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
