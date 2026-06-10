import { baseTemplate } from './base'
import { EMAIL_CONFIG } from '../index'
import type { OrderItem } from '@/types'

export interface MerchantOrderPaidEmailProps {
  storeName:      string
  orderNumber:    string
  customerName:   string
  customerPhone:  string
  totalLabel:     string
  netLabel:       string
  paymentLabel:   string
  items:          OrderItem[]
  orderId:        string
}

function formatItemLine(item: OrderItem): string {
  const parts = [`${item.qty}x ${item.name}`]
  if (item.size) parts.push(`tam. ${item.size}`)
  if (item.color) parts.push(`cor: ${item.color}`)
  return parts.join(' — ')
}

export function merchantOrderPaidEmailHtml(props: MerchantOrderPaidEmailProps): string {
  const adminUrl = `${EMAIL_CONFIG.baseUrl}/admin/pedidos`

  const itemsHtml = props.items
    .map(i => `<li style="margin:0 0 6px;font-size:14px;color:#444444;">${formatItemLine(i)}</li>`)
    .join('')

  const content = `
    <h1 style="font-family:'Syne',Arial,sans-serif;font-size:22px;color:#08080F;margin:0 0 16px;">
      Novo pedido pago via checkout
    </h1>
    <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.6;">
      <strong>${props.storeName}</strong> recebeu um pagamento confirmado.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F8FC;border-radius:12px;margin:0 0 20px;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0 0 8px;font-size:13px;color:#888888;">Pedido</p>
          <p style="margin:0 0 12px;font-size:18px;font-weight:700;color:#08080F;">#${props.orderNumber}</p>
          <p style="margin:0 0 4px;font-size:14px;color:#444444;"><strong>Cliente:</strong> ${props.customerName}</p>
          <p style="margin:0 0 4px;font-size:14px;color:#444444;"><strong>WhatsApp:</strong> ${props.customerPhone}</p>
          <p style="margin:0 0 4px;font-size:14px;color:#444444;"><strong>Valor:</strong> ${props.totalLabel} (líquido: ${props.netLabel})</p>
          <p style="margin:0;font-size:14px;color:#444444;"><strong>Pagamento:</strong> ${props.paymentLabel}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#888888;">Produtos</p>
    <ul style="margin:0 0 20px;padding-left:20px;">${itemsHtml}</ul>
    <a href="${adminUrl}" style="display:inline-block;background:#7B6EFF;color:#FFFFFF;font-weight:700;text-decoration:none;padding:14px 24px;border-radius:10px;font-size:14px;">
      Ver pedido no painel
    </a>
  `

  return baseTemplate(content, `Novo pedido pago #${props.orderNumber}`)
}
