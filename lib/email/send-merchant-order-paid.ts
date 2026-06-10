import { sendEmail } from './index'
import { merchantOrderPaidEmailHtml } from './templates/merchant-order-paid'
import type { OrderItem } from '@/types'

export async function sendMerchantOrderPaidEmail(params: {
  to:             string
  storeName:      string
  orderNumber:    string
  orderId:        string
  customerName:   string
  customerPhone:  string
  total:          number
  netValue:       number | null
  paymentMethod:  string | null
  installments:   number | null
  items:          OrderItem[]
}) {
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  let paymentLabel = 'PIX'
  if (params.paymentMethod === 'CARTAO') {
    const n = params.installments ?? 1
    paymentLabel = n > 1 ? `Cartão ${n}x` : 'Cartão à vista'
  }

  const html = merchantOrderPaidEmailHtml({
    storeName:     params.storeName,
    orderNumber:   params.orderNumber,
    orderId:       params.orderId,
    customerName:  params.customerName,
    customerPhone: params.customerPhone,
    totalLabel:    fmt(params.total),
    netLabel:      fmt(params.netValue ?? params.total),
    paymentLabel,
    items:         params.items,
  })

  return sendEmail({
    to:      params.to,
    subject: `Novo pedido pago #${params.orderNumber} — ${params.storeName}`,
    html,
  })
}
