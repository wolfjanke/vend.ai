import type { CartItem, DeliveryAddress, Store } from '@/types'

interface CheckoutPayload {
  store:            Store
  items:            CartItem[]
  name:             string
  phone:            string
  notes?:           string
  orderNum:         string
  deliveryAddress?: DeliveryAddress
}

// ─── Formata a mensagem de pedido para WhatsApp ───────────────────────────────
export function formatOrderMessage(payload: CheckoutPayload): string {
  const { store, items, name, phone, notes, orderNum, deliveryAddress } = payload

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

  lines.push(
    `━━━━━━━━━━━━━━━`,
    `🧾 *Itens do Pedido:*`,
    itemLines,
    `━━━━━━━━━━━━━━━`,
    `💰 *Total: R$\u00a0${total.toFixed(2).replace('.', ',')}*`
  )

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
