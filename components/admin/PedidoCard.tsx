'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import type { DeliveryAddress, Order, OrderStatus } from '@/types'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types'
import { updateOrderStatus } from '@/app/admin/actions'

interface Props {
  order: Order
  storeId: string
}

const NEXT_ACTIONS: Record<OrderStatus, Array<{ status: OrderStatus; label: string; cls: string; destructive?: boolean }>> = {
  NOVO: [
    { status: 'CONFIRMADO', label: 'Confirmar', cls: 'text-primary border-primary/40 hover:bg-primary/20' },
    { status: 'CANCELADO', label: 'Cancelar', cls: 'text-warm border-warm/40 hover:bg-warm/10', destructive: true },
  ],
  CONFIRMADO: [
    { status: 'EM_ENTREGA', label: 'Em entrega', cls: 'text-yellow-400 border-yellow-400/40 hover:bg-yellow-400/10' },
    { status: 'CANCELADO', label: 'Cancelar', cls: 'text-warm border-warm/40 hover:bg-warm/10', destructive: true },
  ],
  EM_ENTREGA: [{ status: 'ENTREGUE', label: 'Entregue', cls: 'text-accent border-accent/40 hover:bg-accent/10' }],
  ENTREGUE: [],
  CANCELADO: [],
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `há ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `há ${hrs}h`
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
  const [status, setStatus] = useState<OrderStatus>(order.status)
  const [pending, startTransition] = useTransition()
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const delivery = parseDelivery(order.delivery_address)

  const dc = Number(order.discount_coupon ?? 0)
  const dp = Number(order.discount_pix ?? 0)
  const showCouponLine = dc > 0
  const showPixLine = dp > 0

  function handleAction(nextStatus: OrderStatus, key: string) {
    startTransition(async () => {
      setPendingKey(key)
      await updateOrderStatus(order.id, nextStatus)
      setStatus(nextStatus)
      setPendingKey(null)
      setCancelConfirm(false)
    })
  }

  const actions = NEXT_ACTIONS[status]

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all">
      {/* Top */}
      <div className="flex items-start justify-between mb-3 gap-2 flex-wrap">
        <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-1 rounded-lg shrink-0">
          #{order.order_number}
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {order.payment_source === 'PDV' && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border border-yellow-400/30 text-yellow-400 bg-yellow-400/10">
              PDV
            </span>
          )}
          {order.payment_source === 'CHECKOUT' && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border border-primary/30 text-primary bg-primary/10">
              Site
            </span>
          )}
          <span
            className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border shrink-0 ${ORDER_STATUS_COLORS[status]}`}
          >
            {ORDER_STATUS_LABELS[status]}
          </span>
        </div>
      </div>

      {/* Customer */}
      <div className="mb-1 font-semibold text-sm break-words">{order.customer_name}</div>
      <a
        href={`https://wa.me/${order.customer_whatsapp}`}
        target="_blank"
        rel="noreferrer"
        className="text-accent text-xs mb-3 block hover:underline break-all"
      >
        {order.customer_whatsapp}
      </a>

      {/* Items */}
      <div className="text-muted text-xs mb-3 leading-relaxed space-y-2">
        {order.items_json.map((item, i) => (
          <div key={i} className="flex gap-2 items-start min-w-0">
            {item.photo ? (
              <img
                src={item.photo}
                alt=""
                className="w-8 h-8 rounded-lg object-cover shrink-0 bg-surface2"
              />
            ) : (
              <span className="w-8 h-8 rounded-lg bg-surface2 shrink-0" aria-hidden />
            )}
            <div className="min-w-0">
              • {item.name}
              {item.color ? ` — ${item.color}` : ''} — {item.size} ({item.qty}x) — R$
              {item.price.toFixed(2).replace('.', ',')}
            </div>
          </div>
        ))}
      </div>

      {delivery && (
        <div className="text-muted text-xs mb-3 leading-relaxed break-words">
          {delivery.logradouro}, {delivery.numero}
          {delivery.complemento ? ` — ${delivery.complemento}` : ''}
          <br />
          {delivery.bairro} — {delivery.cidade}/{delivery.uf} · CEP {delivery.cep}
        </div>
      )}

      {order.notes?.trim() && (
        <div className="text-muted text-xs mb-3 italic break-words">Obs: {order.notes.trim()}</div>
      )}

      <div className="text-xs text-muted mb-3 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span>Subtotal</span>
          <span className="tabular-nums">R${Number(order.subtotal ?? order.total).toFixed(2).replace('.', ',')}</span>
        </div>
        {showCouponLine && (
          <div className="flex items-center justify-between gap-2">
            <span>Desconto cupom</span>
            <span className="tabular-nums">- R${dc.toFixed(2).replace('.', ',')}</span>
          </div>
        )}
        {showPixLine && (
          <div className="flex items-center justify-between gap-2">
            <span>Desconto PIX</span>
            <span className="tabular-nums">- R${dp.toFixed(2).replace('.', ',')}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-foreground gap-2">
          <span>Pagamento</span>
          <span>{order.payment_method === 'PIX' ? 'PIX' : 'Outro'}</span>
        </div>
        <div className="flex items-center justify-between text-foreground gap-2 min-w-0">
          <span className="shrink-0">Cupom</span>
          <span className="break-all text-right">{order.coupon_code_applied ?? '—'}</span>
        </div>
      </div>

      {/* Bottom */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <span className="text-accent font-bold text-base tabular-nums">
          R${Number(order.total_final ?? order.total).toFixed(2).replace('.', ',')}
        </span>
        <span className="text-muted text-[11px] shrink-0">{timeAgo(order.created_at)}</span>
      </div>

      {cancelConfirm && (
        <div className="mb-3 p-3 rounded-xl border border-warm/40 bg-warm/5 text-sm">
          <p className="text-foreground font-medium mb-2">Tem certeza? Esta ação não pode ser desfeita.</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCancelConfirm(false)}
              className="px-3 py-2 min-h-[40px] rounded-lg border border-border text-xs font-semibold text-muted hover:text-foreground"
            >
              Não
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => handleAction('CANCELADO', 'cancel')}
              className="px-3 py-2 min-h-[40px] rounded-lg border border-warm text-warm text-xs font-semibold hover:bg-warm/10 disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {pending && pendingKey === 'cancel' ? <Loader2 size={14} className="animate-spin" /> : null}
              Sim, cancelar
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      {actions.length > 0 && !cancelConfirm && (
        <div className="flex gap-2 flex-wrap">
          {actions.map(action => (
            <button
              key={action.status}
              onClick={() => {
                if (action.destructive) {
                  setCancelConfirm(true)
                  return
                }
                handleAction(action.status, action.status)
              }}
              disabled={pending}
              className={`px-3.5 py-2 min-h-[40px] rounded-lg border text-xs font-semibold transition-all disabled:opacity-50 inline-flex items-center justify-center gap-1.5 ${action.cls}`}
            >
              {pending && pendingKey === action.status && !action.destructive ? (
                <Loader2 size={14} className="animate-spin" />
              ) : null}
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
