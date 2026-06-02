import { logSandbox } from './config'
import { createPayment } from './wolf-hub'
import { buildCheckoutSplit } from './split'
import type { Store, InstallmentQuote } from '@/types'

export interface AsaasCustomer {
  name: string
  cpfCnpj?: string
  email?: string
  mobilePhone?: string
}

export interface AsaasOrderItem {
  description: string
  quantity: number
  value: number
}

export interface CheckoutPaymentResult {
  asaas_payment_id: string
  invoiceUrl: string | null
  pixQrCode?: string | null
  pixCopiaECola?: string | null
}

interface AsaasPaymentResponse {
  id: string
  invoiceUrl?: string
  pixQrCode?: string
  pixCopiaECola?: string
  [key: string]: unknown
}

type BillingType = 'PIX' | 'CREDIT_CARD' | 'BOLETO'

export async function createCheckoutPayment(
  store: Store,
  quote: InstallmentQuote,
  billingType: BillingType,
  customer: AsaasCustomer,
  items: AsaasOrderItem[],
  creditCardToken?: string,
): Promise<CheckoutPaymentResult> {
  if (!store.asaas_wallet_id) {
    throw new Error('Loja sem walletId Asaas — split impossível')
  }

  if (quote.merchantSharePct <= 0 || quote.merchantSharePct >= 100) {
    throw new Error(`merchantSharePct inválido: ${quote.merchantSharePct}`)
  }

  const split = buildCheckoutSplit(store.asaas_wallet_id, quote)
  logSandbox('checkout split', { entries: split.length })

  const body: Record<string, unknown> = {
    billingType,
    value: quote.totalComJuros,
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: items.map(i => `${i.quantity}x ${i.description}`).join(', '),
    customer: {
      name: customer.name,
      cpfCnpj: customer.cpfCnpj ?? undefined,
      email: customer.email ?? undefined,
      mobilePhone: customer.mobilePhone ?? undefined,
    },
    split,
  }

  if (billingType === 'CREDIT_CARD' && quote.faixaTaxa > 0) {
    const installmentCount = Math.round(quote.totalComJuros / quote.installmentValue)
    if (installmentCount > 1) {
      body.installmentCount = installmentCount
      body.installmentValue = quote.installmentValue
    }
  }

  if (billingType === 'CREDIT_CARD' && creditCardToken) {
    body.creditCardToken = creditCardToken
  }

  const response = await createPayment(body) as AsaasPaymentResponse

  return {
    asaas_payment_id: response.id,
    invoiceUrl: response.invoiceUrl ?? null,
    pixQrCode: response.pixQrCode ?? null,
    pixCopiaECola: response.pixCopiaECola ?? null,
  }
}

export async function createPdvPaymentLink(
  store: Store,
  quote: InstallmentQuote,
  installments: number,
  customer: AsaasCustomer,
): Promise<{ asaas_payment_id: string; invoiceUrl: string }> {
  if (!store.asaas_wallet_id) {
    throw new Error('Loja sem walletId Asaas — split impossível')
  }

  const split = buildCheckoutSplit(store.asaas_wallet_id, quote)

  const body: Record<string, unknown> = {
    billingType: 'UNDEFINED',
    value: quote.totalComJuros,
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: `Pedido PDV — ${customer.name}`,
    customer: {
      name: customer.name,
      cpfCnpj: customer.cpfCnpj ?? undefined,
      email: customer.email ?? undefined,
      mobilePhone: customer.mobilePhone ?? undefined,
    },
    split,
  }

  if (installments > 1) {
    body.installmentCount = installments
    body.installmentValue = quote.installmentValue
  }

  const response = await createPayment(body) as AsaasPaymentResponse

  if (!response.invoiceUrl) {
    throw new Error('Asaas não retornou invoiceUrl para link PDV')
  }

  return {
    asaas_payment_id: response.id,
    invoiceUrl: response.invoiceUrl,
  }
}
