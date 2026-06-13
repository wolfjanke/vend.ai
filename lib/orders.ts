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

export function orderItemsToCartItems(items: OrderItem[]): CartItem[] {
  return items
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
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  return Math.max(0, Number(subtotal.toFixed(2)))
}

export function canRestoreStockOnCancel(
  status: OrderStatus,
  paymentStatus: Order['payment_status'],
): boolean {
  return status === 'CONFIRMADO' && paymentStatus === 'CONFIRMED'
}
