import { baseTemplate } from './base'
import { EMAIL_CONFIG } from '../index'

export interface OrderConfirmationEmailProps {
  customerName: string
  storeName:    string
  storeSlug:    string
  orderNumber:  string
  totalLabel:   string
}

export function orderConfirmationEmailHtml(props: OrderConfirmationEmailProps): string {
  const { customerName, storeName, storeSlug, orderNumber, totalLabel } = props
  const storeUrl = `${EMAIL_CONFIG.baseUrl}/${storeSlug}`

  const content = `
    <h1 style="font-family:'Syne',Arial,sans-serif;font-size:22px;color:#08080F;margin:0 0 16px;">
      Pedido confirmado
    </h1>
    <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.6;">
      Olá, <strong>${customerName}</strong>! Sua compra em <strong>${storeName}</strong> foi registrada com sucesso.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F8FC;border-radius:12px;margin:0 0 20px;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0 0 8px;font-size:13px;color:#888888;">Número do pedido</p>
          <p style="margin:0 0 12px;font-size:18px;font-weight:700;color:#08080F;">${orderNumber}</p>
          <p style="margin:0 0 8px;font-size:13px;color:#888888;">Total</p>
          <p style="margin:0;font-size:18px;font-weight:700;color:#7B6EFF;">${totalLabel}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 20px;font-size:14px;color:#444444;line-height:1.6;">
      A loja pode entrar em contato pelo WhatsApp para combinar entrega ou retirada.
    </p>
    <a href="${storeUrl}" style="display:inline-block;background:#7B6EFF;color:#FFFFFF;font-weight:700;text-decoration:none;padding:14px 24px;border-radius:10px;font-size:14px;">
      Voltar à loja
    </a>
  `

  return baseTemplate(content, `Pedido ${orderNumber} confirmado em ${storeName}`)
}
