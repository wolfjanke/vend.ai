import { sendEmail } from './index'
import { orderConfirmationEmailHtml } from './templates/order-confirmation'

export async function sendOrderConfirmationEmail(params: {
  to:           string
  customerName: string
  storeName:    string
  storeSlug:    string
  orderNumber:  string
  total:        number
}) {
  const totalLabel = params.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const html = orderConfirmationEmailHtml({
    customerName: params.customerName,
    storeName:    params.storeName,
    storeSlug:    params.storeSlug,
    orderNumber:  params.orderNumber,
    totalLabel,
  })

  return sendEmail({
    to:      params.to,
    subject: `Pedido ${params.orderNumber} confirmado — ${params.storeName}`,
    html,
  })
}
