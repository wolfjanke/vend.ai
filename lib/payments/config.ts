/** Configuração central Asaas — conta única vend.ai (Wolf Hub Desenvolvimento de Software LTDA). */

export function getAsaasEnv(): 'sandbox' | 'production' {
  const env = (process.env.ASAAS_ENV ?? 'sandbox').toLowerCase()
  return env === 'production' ? 'production' : 'sandbox'
}

export function isSandboxMode(): boolean {
  return getAsaasEnv() !== 'production'
}

export function getAsaasBaseUrl(): string {
  if (process.env.ASAAS_BASE_URL?.trim()) {
    return process.env.ASAAS_BASE_URL.replace(/\/$/, '')
  }
  return isSandboxMode()
    ? 'https://sandbox.asaas.com/api/v3'
    : 'https://api.asaas.com/v3'
}

/** Chave API da conta Asaas do vend.ai (conta mãe — subcontas dos lojistas). */
export function getVendaiAsaasKey(): string | undefined {
  return (
    process.env.VENDAI_ASAAS_KEY?.trim()
    || process.env.WOLF_HUB_ASAAS_KEY?.trim()
    || process.env.ASAAS_API_KEY?.trim()
    || undefined
  )
}

/** Wallet ID do vend.ai na conta Asaas (recebe take rate no split). */
export function getVendaiAsaasWalletId(): string | undefined {
  return (
    process.env.VENDAI_ASAAS_WALLET_ID?.trim()
    || process.env.WOLF_HUB_WALLET_ID?.trim()
    || undefined
  )
}

/** @deprecated Use getVendaiAsaasKey */
export const getWolfHubApiKey = getVendaiAsaasKey

/** @deprecated Use getVendaiAsaasWalletId */
export const getWolfHubWalletId = getVendaiAsaasWalletId

export function logSandbox(context: string, data?: Record<string, unknown>): void {
  if (!isSandboxMode()) return
  console.info(`[payments] SANDBOX MODE — ${context}`, data ?? {})
}

export function assertPaymentsConfigured(): void {
  if (!getVendaiAsaasKey()) {
    throw new Error(
      'Pagamentos não configurados. Defina VENDAI_ASAAS_KEY no ambiente.',
    )
  }
}
