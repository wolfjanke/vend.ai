import { asaasFetch } from './client'
import type { Store, InstallmentQuote } from '@/types'

export interface AsaasCustomer {
  name:         string
  cpfCnpj?:     string
  email?:       string
  mobilePhone?: string
}

export interface AsaasOrderItem {
  description: string
  quantity:    number
  value:       number
}

export interface CheckoutPaymentResult {
  asaas_payment_id: string
  invoiceUrl:       string | null
  pixQrCode?:       string | null
  pixCopiaECola?:   string | null
}

interface AsaasPaymentResponse {
  id:                      string
  invoiceUrl?:             string
  pixQrCode?:              string
  pixCopiaECola?:          string
  installmentCount?:       number
  installmentValue?:       number
  [key: string]: unknown
}

type BillingType = 'PIX' | 'CREDIT_CARD' | 'BOLETO'

/**
 * Cria uma cobrança no Asaas com split para o lojista.
 * REGRA: nunca inclui o walletId do emissor (conta raiz vend.ai) no split.
 * REGRA: merchantSharePct = 100 - platformTakePct (nunca o contrário).
 */
export async function createCheckoutPayment(
  store:        Store,
  quote:        InstallmentQuote,
  billingType:  BillingType,
  customer:     AsaasCustomer,
  items:        AsaasOrderItem[],
  creditCardToken?: string,
): Promise<CheckoutPaymentResult> {
  if (!store.asaas_wallet_id) {
    throw new Error('Loja sem walletId Asaas — split impossível')
  }

  if (quote.merchantSharePct > 100 || quote.merchantSharePct <= 0) {
    throw new Error(`merchantSharePct inválido: ${quote.merchantSharePct}`)
  }

  const grossValue = quote.totalComJuros

  const body: Record<string, unknown> = {
    billingType,
    value:       grossValue,
    dueDate:     new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: items.map(i => `${i.quantity}x ${i.description}`).join(', '),
    customer: {
      name:        customer.name,
      cpfCnpj:     customer.cpfCnpj ?? undefined,
      email:       customer.email ?? undefined,
      mobilePhone: customer.mobilePhone ?? undefined,
    },
    split: [
      {
        walletId:       store.asaas_wallet_id,
        percentualValue: quote.merchantSharePct,
      },
    ],
  }

  if (billingType === 'CREDIT_CARD' && quote.faixaTaxa > 0) {
    // Parcelado ou à vista no cartão — installmentCount=1 para à vista
    const installmentCount = Math.round(quote.totalComJuros / quote.installmentValue)
    if (installmentCount > 1) {
      body.installmentCount = installmentCount
      body.installmentValue = quote.installmentValue
    }
  }

  if (billingType === 'CREDIT_CARD' && creditCardToken) {
    body.creditCardToken = creditCardToken
  }

  const response = await asaasFetch<AsaasPaymentResponse>('/payments', {
    method: 'POST',
    body:   JSON.stringify(body),
  })

  return {
    asaas_payment_id: response.id,
    invoiceUrl:       response.invoiceUrl ?? null,
    pixQrCode:        response.pixQrCode ?? null,
    pixCopiaECola:    response.pixCopiaECola ?? null,
  }
}

/**
 * Cria um link de pagamento para uso no PDV (envia pelo WhatsApp).
 */
export async function createPdvPaymentLink(
  store:        Store,
  quote:        InstallmentQuote,
  installments: number,
  customer:     AsaasCustomer,
): Promise<{ asaas_payment_id: string; invoiceUrl: string }> {
  if (!store.asaas_wallet_id) {
    throw new Error('Loja sem walletId Asaas — split impossível')
  }

  const body: Record<string, unknown> = {
    billingType: 'UNDEFINED', // permite PIX ou cartão
    value:       quote.totalComJuros,
    dueDate:     new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: `Pedido PDV — ${customer.name}`,
    customer: {
      name:        customer.name,
      cpfCnpj:     customer.cpfCnpj ?? undefined,
      email:       customer.email ?? undefined,
      mobilePhone: customer.mobilePhone ?? undefined,
    },
    split: [
      {
        walletId:        store.asaas_wallet_id,
        percentualValue: quote.merchantSharePct,
      },
    ],
  }

  if (installments > 1) {
    body.installmentCount = installments
    body.installmentValue = quote.installmentValue
  }

  const response = await asaasFetch<AsaasPaymentResponse>('/payments', {
    method: 'POST',
    body:   JSON.stringify(body),
  })

  if (!response.invoiceUrl) {
    throw new Error('Asaas não retornou invoiceUrl para link PDV')
  }

  return {
    asaas_payment_id: response.id,
    invoiceUrl:       response.invoiceUrl,
  }
}
