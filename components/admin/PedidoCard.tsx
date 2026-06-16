'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import type { DeliveryAddress, Order, OrderItem, OrderStatus } from '@/types'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types'
import { updateOrderStatus } from '@/app/admin/actions'
import { isQuoteOrder, normalizeOrderItems, quoteStatusLabel } from '@/lib/orders'
import { formatPhoneDisplay, whatsappWaMeDigits } from '@/lib/masks'
import PedidoQuoteEditor from '@/components/admin/PedidoQuoteEditor'

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

function fmtMoney(v: number | string) {
  return `R$${Number(v).toFixed(2).replace('.', ',')}`
}

export default function PedidoCard({ order }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState<OrderStatus>(order.status)
  const [items, setItems] = useState<OrderItem[]>(() => normalizeOrderItems(order.items_json ?? []))
  const [notes, setNotes] = useState(order.notes ?? '')
  const [total, setTotal] = useState(Number(order.total_final ?? order.total))
  const [subtotal, setSubtotal] = useState(Number(order.subtotal ?? order.total))
  const [pending, startTransition] = useTransition()
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [editing, setEditing] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const delivery = parseDelivery(order.delivery_address)

  const quote = isQuoteOrder({ ...order, status })
  const statusLabel = quoteStatusLabel({ ...order, status }, ORDER_STATUS_LABELS[status])
  const statusColor = quote
    ? 'text-warm bg-warm/10 border-warm/30'
    : ORDER_STATUS_COLORS[status]

  const dc = Number(order.discount_coupon ?? 0)
  const dp = Number(order.discount_pix ?? 0)
  const showCouponLine = dc > 0
  const showPixLine = dp > 0

  function handleAction(nextStatus: OrderStatus, key: string) {
    startTransition(async () => {
      setPendingKey(key)
      setActionError(null)
      try {
        await updateOrderStatus(order.id, nextStatus)
        setStatus(nextStatus)
        setCancelConfirm(false)
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Não foi possível atualizar o pedido.')
      } finally {
        setPendingKey(null)
      }
    })
  }

  async function confirmQuotePayment() {
    setPendingKey('confirm_payment')
    setActionError(null)
    try {
      const res = await fetch(`/api/admin/pedidos/${order.id}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'confirm_payment' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setActionError(data.error ?? 'Não foi possível confirmar o pagamento.')
        return
      }
      setStatus('CONFIRMADO')
      router.refresh()
    } catch {
      setActionError('Erro de conexão.')
    } finally {
      setPendingKey(null)
    }
  }

  const actions = quote
    ? [
        { key: 'confirm_payment', label: 'Pagamento confirmado', cls: 'text-accent border-accent/40 hover:bg-accent/10' },
        { key: 'edit', label: 'Editar orçamento', cls: 'text-primary border-primary/40 hover:bg-primary/20' },
        { key: 'cancel', label: 'Descartar', cls: 'text-warm border-warm/40 hover:bg-warm/10', destructive: true },
      ]
    : NEXT_ACTIONS[status].map(a => ({ ...a, key: a.status }))

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all">
      <div className="flex items-start justify-between mb-3 gap-2 flex-wrap">
        <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-1 rounded-lg shrink-0">
          #{order.order_number}
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(order.payment_source === 'WHATSAPP' || quote) && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border border-accent/30 text-accent bg-accent/10">
              WhatsApp
            </span>
          )}
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
          <span className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border shrink-0 ${statusColor}`}>
            {statusLabel}
          </span>
        </div>
      </div>

      {quote && !editing && (
        <p className="text-[11px] text-muted mb-3 leading-relaxed">
          Intenção de compra pelo WhatsApp — o estoque só baixa quando você confirmar o pagamento.
        </p>
      )}

      {editing ? (
        <PedidoQuoteEditor
          orderId={order.id}
          initialItems={items}
          initialNotes={notes}
          onSaved={(nextItems, nextNotes, nextTotal) => {
            setItems(nextItems)
            setNotes(nextNotes)
            setTotal(nextTotal)
            setSubtotal(nextItems.reduce((s, i) => s + i.price * i.qty, 0))
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <>
          <div className="mb-1 font-semibold text-sm break-words">{order.customer_name}</div>
          <a
            href={`https://wa.me/${whatsappWaMeDigits(order.customer_whatsapp)}`}
            target="_blank"
            rel="noreferrer"
            className="text-accent text-xs mb-1 block hover:underline"
          >
            {formatPhoneDisplay(order.customer_whatsapp)}
          </a>
          {order.customer_cpf_enc && (
            <p className="text-[10px] text-muted mb-3">CPF informado no orçamento</p>
          )}

          <div className="text-muted text-xs mb-3 leading-relaxed space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex gap-2 items-start min-w-0">
                {item.photo ? (
                  <img src={item.photo} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0 bg-surface2" />
                ) : (
                  <span className="w-8 h-8 rounded-lg bg-surface2 shrink-0" aria-hidden />
                )}
                <div className="min-w-0">
                  • {item.name}
                  {item.color ? ` — ${item.color}` : ''} — {item.size} ({item.qty}x) — {fmtMoney(item.price)}
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

          {notes.trim() && (
            <div className="text-muted text-xs mb-3 italic break-words">Obs: {notes.trim()}</div>
          )}

          <div className="text-xs text-muted mb-3 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span>Subtotal</span>
              <span className="tabular-nums">{fmtMoney(subtotal)}</span>
            </div>
            {showCouponLine && (
              <div className="flex items-center justify-between gap-2">
                <span>Desconto cupom</span>
                <span className="tabular-nums">- {fmtMoney(dc)}</span>
              </div>
            )}
            {showPixLine && (
              <div className="flex items-center justify-between gap-2">
                <span>Desconto PIX</span>
                <span className="tabular-nums">- {fmtMoney(dp)}</span>
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

          <div className="flex items-center justify-between mb-3 gap-2">
            <span className="text-accent font-bold text-base tabular-nums">{fmtMoney(total)}</span>
            <span className="text-muted text-[11px] shrink-0">{timeAgo(order.created_at)}</span>
          </div>
        </>
      )}

      {actionError && (
        <p className="text-xs text-warm mb-3 break-words">{actionError}</p>
      )}

      {cancelConfirm && (
        <div className="mb-3 p-3 rounded-xl border border-warm/40 bg-warm/5 text-sm">
          <p className="text-foreground font-medium mb-2">
            {quote ? 'Descartar este orçamento?' : 'Tem certeza? Esta ação não pode ser desfeita.'}
          </p>
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
              {quote ? 'Sim, descartar' : 'Sim, cancelar'}
            </button>
          </div>
        </div>
      )}

      {actions.length > 0 && !cancelConfirm && !editing && (
        <div className="flex gap-2 flex-wrap">
          {actions.map(action => (
            <button
              key={action.key}
              onClick={() => {
                if (action.destructive) {
                  setCancelConfirm(true)
                  return
                }
                if (action.key === 'edit') {
                  setEditing(true)
                  return
                }
                if (action.key === 'confirm_payment') {
                  void confirmQuotePayment()
                  return
                }
                if ('status' in action && action.status) {
                  handleAction(action.status, action.key)
                }
              }}
              disabled={pending || pendingKey === action.key}
              className={`px-3.5 py-2 min-h-[40px] rounded-lg border text-xs font-semibold transition-all disabled:opacity-50 inline-flex items-center justify-center gap-1.5 ${action.cls}`}
            >
              {pendingKey === action.key ? <Loader2 size={14} className="animate-spin" /> : null}
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
