import type { CartItem, CheckoutChannel, CheckoutPaymentMethod, DeliveryAddress, Store } from '@/types'
import type { PricingResult } from '@/lib/pricing'

function paymentMethodLabel(m: CheckoutPaymentMethod | string): string {
  const map: Record<string, string> = {
    PIX:     'PIX',
    CARTAO:  'Cartão',
    DINHEIRO: 'Dinheiro',
    OUTRO:   'Outro',
  }
  return map[m] ?? String(m)
}

interface CheckoutPayload {
  store:            Store
  items:            CartItem[]
  name:             string
  phone:            string
  notes?:           string
  orderNum:         string
  deliveryAddress?: DeliveryAddress
  pricing?:         PricingResult & { deliveryFee?: number; grandTotal?: number }
  checkoutChannel?: CheckoutChannel
  paymentMethod?:   CheckoutPaymentMethod | string
}

// ─── Formata a mensagem de pedido para WhatsApp ───────────────────────────────
export function formatOrderMessage(payload: CheckoutPayload): string {
  const { store, items, name, phone, notes, orderNum, deliveryAddress, pricing, checkoutChannel, paymentMethod } = payload

  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0)
  const now   = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })

  const itemLines = items
    .map(item => {
      const subtotal = (item.price * item.qty).toFixed(2).replace('.', ',')
      return `• ${item.name}${item.color ? ` — ${item.color}` : ''} — ${item.size} (${item.qty}x) — R$\u00a0${subtotal}`
    })
    .join('\n')

  const lines: string[] = [
    `🛍️ *Novo Pedido #${orderNum} — vend.ai*`,
    ``,
    `👤 *Cliente:* ${name}`,
    `📱 *WhatsApp:* ${phone}`,
    ``,
  ]

  if (deliveryAddress) {
    lines.push(
      `📍 *Entrega:*`,
      `${deliveryAddress.logradouro}, ${deliveryAddress.numero}${deliveryAddress.complemento ? ` — ${deliveryAddress.complemento}` : ''}`,
      `${deliveryAddress.bairro} — ${deliveryAddress.cidade}/${deliveryAddress.uf}`,
      `CEP: ${deliveryAddress.cep}`,
      ``
    )
  }

  const deliveryFee = pricing?.deliveryFee ?? 0
  const productsTotal = pricing?.totalFinal ?? total
  const grand = pricing?.grandTotal != null ? pricing.grandTotal : productsTotal + deliveryFee

  lines.push(
    `━━━━━━━━━━━━━━━`,
    `🧾 *Itens do Pedido:*`,
    itemLines,
    `━━━━━━━━━━━━━━━`,
    `💰 *Subtotal: R$\u00a0${(pricing?.subtotal ?? total).toFixed(2).replace('.', ',')}*`,
    `🎟️ Desconto cupom: R$\u00a0${(pricing?.discountCoupon ?? 0).toFixed(2).replace('.', ',')}`,
    `⚡ Desconto PIX: R$\u00a0${(pricing?.discountPix ?? 0).toFixed(2).replace('.', ',')}`,
    `📦 Frete: R$\u00a0${deliveryFee.toFixed(2).replace('.', ',')}`,
    `💵 *Total (produtos + frete): R$\u00a0${grand.toFixed(2).replace('.', ',')}*`,
    `💳 Pagamento: ${paymentMethodLabel(paymentMethod ?? (pricing?.paymentMethod === 'PIX' ? 'PIX' : 'OUTRO'))}`,
    `🏷️ Cupom aplicado: ${pricing?.couponCodeApplied ?? 'nenhum'}`
  )

  if (checkoutChannel === 'site') {
    lines.push(`🌐 *Canal:* Site (combinar pagamento com a loja)`)
  } else if (checkoutChannel === 'whatsapp') {
    lines.push(`💬 *Canal:* WhatsApp`)
  }

  if (notes?.trim()) lines.push('', `📝 *Obs:* ${notes.trim()}`)
  lines.push(``, `⏰ ${now}`, ``, `Pedido feito via vend.ai/\u200b${store.slug}`)

  return lines.join('\n')
}

// ─── Gera URL wa.me ───────────────────────────────────────────────────────────
export function buildWhatsAppUrl(whatsapp: string, message: string): string {
  const number = whatsapp.replace(/\D/g, '')
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

// ─── Gera número de pedido ────────────────────────────────────────────────────
export function generateOrderNumber(): string {
  return String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0')
}
