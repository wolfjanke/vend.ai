import {
  assertPaymentsConfigured,
  getAsaasBaseUrl,
  getVendaiAsaasKey,
  isSandboxMode,
  logSandbox,
} from './config'

export interface AsaasErrorShape {
  status: number
  code: string
  description: string
}

export class AsaasApiError extends Error {
  status: number
  code: string
  description: string

  constructor(error: AsaasErrorShape) {
    super(error.description)
    this.name = 'AsaasApiError'
    this.status = error.status
    this.code = error.code
    this.description = error.description
  }
}

const RETRY_DELAYS = [500, 1000]

export async function wolfHubFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
  overrideApiKey?: string,
): Promise<T> {
  const apiKey = overrideApiKey ?? getVendaiAsaasKey()
  const baseUrl = getAsaasBaseUrl()

  if (!apiKey) {
    throw new AsaasApiError({
      status: 0,
      code: 'MISSING_API_KEY',
      description: 'VENDAI_ASAAS_KEY não configurada',
    })
  }

  logSandbox(`wolfHubFetch ${options.method ?? 'GET'} ${path}`)

  const url = `${baseUrl}${path}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    access_token: apiKey,
    'User-Agent': 'vend.ai/1.0',
    ...((options.headers as Record<string, string>) ?? {}),
  }

  async function attempt(attemptNum: number): Promise<T> {
    const res = await fetch(url, { ...options, headers })

    if (res.ok) {
      if (res.status === 204) return undefined as T
      return res.json() as Promise<T>
    }

    const isServerError = res.status >= 500
    let code = `HTTP_${res.status}`
    let description = res.statusText || 'Erro na API Asaas'

    try {
      const body = (await res.json()) as { errors?: Array<{ code: string; description: string }> }
      if (body?.errors?.[0]) {
        code = body.errors[0].code
        description = body.errors[0].description
      }
    } catch {
      /* ignore */
    }

    if (isServerError && attemptNum < RETRY_DELAYS.length) {
      await new Promise(r => setTimeout(r, RETRY_DELAYS[attemptNum]))
      return attempt(attemptNum + 1)
    }

    throw new AsaasApiError({ status: res.status, code, description })
  }

  return attempt(0)
}

export interface CreateCustomerInput {
  name: string
  email: string
  cpfCnpj?: string
  mobilePhone?: string
  externalReference?: string
}

export async function createCustomer(input: CreateCustomerInput): Promise<{ id: string }> {
  assertPaymentsConfigured()
  return wolfHubFetch<{ id: string }>('/customers', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      cpfCnpj: input.cpfCnpj,
      mobilePhone: input.mobilePhone,
      externalReference: input.externalReference,
    }),
  })
}

export async function createPayment(body: Record<string, unknown>): Promise<{ id: string; invoiceUrl?: string; pixQrCode?: string; pixCopiaECola?: string }> {
  assertPaymentsConfigured()
  logSandbox('createPayment', { value: body.value, split: body.split })
  return wolfHubFetch('/payments', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export interface AsaasPaymentStatus {
  id: string
  status: string
  billingType?: string
}

export async function getPayment(paymentId: string): Promise<AsaasPaymentStatus> {
  assertPaymentsConfigured()
  return wolfHubFetch<AsaasPaymentStatus>(`/payments/${paymentId}`)
}

export async function asaasCreateSubscription(body: Record<string, unknown>): Promise<{ id: string }> {
  assertPaymentsConfigured()
  logSandbox('asaasCreateSubscription', { value: body.value, cycle: body.cycle })
  return wolfHubFetch<{ id: string }>('/subscriptions', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function cancelSubscriptionAsaas(subscriptionId: string): Promise<void> {
  assertPaymentsConfigured()
  await wolfHubFetch(`/subscriptions/${subscriptionId}`, { method: 'DELETE' })
}

export function paymentsNotConfiguredMessage(): string {
  if (isSandboxMode()) {
    return 'Assinaturas em modo teste — configure VENDAI_ASAAS_KEY e VENDAI_ASAAS_WALLET_ID para cobrança de planos no sandbox.'
  }
  return 'Cobrança de planos não configurada. Entre em contato com o suporte.'
}
