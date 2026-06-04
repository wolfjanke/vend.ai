/** Configuração central Asaas / Wolf Hub. */

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

export function getWolfHubApiKey(): string | undefined {
  return process.env.WOLF_HUB_ASAAS_KEY?.trim() || process.env.ASAAS_API_KEY?.trim() || undefined
}

export function getWolfHubWalletId(): string | undefined {
  return process.env.WOLF_HUB_WALLET_ID?.trim() || undefined
}

export function logSandbox(context: string, data?: Record<string, unknown>): void {
  if (!isSandboxMode()) return
  console.info(`[payments] SANDBOX MODE — ${context}`, data ?? {})
}

export function assertPaymentsConfigured(): void {
  if (!getWolfHubApiKey()) {
    throw new Error(
      'Pagamentos não configurados. Defina WOLF_HUB_ASAAS_KEY (ou ASAAS_API_KEY) no ambiente.',
    )
  }
}
