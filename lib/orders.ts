import type { CartItem, Order, OrderItem, OrderStatus } from '@/types'

/** Pedido via WhatsApp ainda não pago — intenção de compra, editável pelo lojista. */
export function isQuoteOrder(
  order: Pick<Order, 'status' | 'payment_source' | 'payment_status'>,
): boolean {
  if (order.status !== 'NOVO') return false
  if (order.payment_status === 'CONFIRMED') return false
  const src = order.payment_source
  return src === 'WHATSAPP' || src == null
}

export function quoteStatusLabel(
  order: Pick<Order, 'status' | 'payment_source' | 'payment_status'>,
  fallback: string,
): string {
  return isQuoteOrder(order) ? 'Orçamento' : fallback
}

/** Badge de status para orçamentos em aberto (distinto de cancelado). */
export const QUOTE_STATUS_COLOR = 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'

/** Normaliza item vindo do JSON do pedido (qty/price podem vir como string). */
export function normalizeOrderItem(raw: OrderItem): OrderItem {
  return {
    ...raw,
    product_id: String(raw.product_id ?? ''),
    variant_id: raw.variant_id != null ? String(raw.variant_id) : undefined,
    name:       String(raw.name ?? ''),
    size:       String(raw.size ?? ''),
    color:      String(raw.color ?? ''),
    qty:        Math.max(1, Math.floor(Number(raw.qty) || 1)),
    price:      Math.max(0, Number(raw.price) || 0),
    photo:      raw.photo,
  }
}

export function normalizeOrderItems(items: OrderItem[]): OrderItem[] {
  return items.map(normalizeOrderItem)
}

export function orderItemsToCartItems(items: OrderItem[]): CartItem[] {
  return normalizeOrderItems(items)
    .filter(i => i.product_id && i.variant_id)
    .map(i => ({
      product_id: i.product_id,
      variant_id: i.variant_id!,
      name:       i.name,
      size:       i.size,
      color:      i.color,
      qty:        i.qty,
      price:      i.price,
      photo:      i.photo,
    }))
}

export function calcOrderTotalFromItems(items: OrderItem[]): number {
  const subtotal = normalizeOrderItems(items).reduce((s, i) => s + i.price * i.qty, 0)
  return Math.max(0, Number(subtotal.toFixed(2)))
}

/** Recalcula total do orçamento mantendo frete/descontos já gravados no pedido. */
export function calcQuoteTotalAfterEdit(
  order: Pick<Order, 'subtotal' | 'discount_total' | 'total' | 'total_final' | 'items_json'>,
  nextItems: OrderItem[],
): { subtotal: number; total: number } {
  const discountTotal = Number(order.discount_total ?? 0)
  const oldSubtotal = Number(order.subtotal ?? calcOrderTotalFromItems(order.items_json ?? []))
  const oldTotal = Number(order.total_final ?? order.total ?? 0)
  const extras = Math.max(0, Number((oldTotal - (oldSubtotal - discountTotal)).toFixed(2)))
  const subtotal = calcOrderTotalFromItems(nextItems)
  const total = Math.max(0, Number((subtotal - discountTotal + extras).toFixed(2)))
  return { subtotal, total }
}

export function canRestoreStockOnCancel(
  status: OrderStatus,
  paymentStatus: Order['payment_status'],
): boolean {
  return status === 'CONFIRMADO' && paymentStatus === 'CONFIRMED'
}
