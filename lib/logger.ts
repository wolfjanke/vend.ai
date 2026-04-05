const SENSITIVE_KEYS = new Set([
  'asaas_api_key_enc',
  'apiKey',
  'asaas_wallet_id',
  'creditCardNumber',
  'creditCardToken',
  'cvv',
  'expiry',
  'password',
  'password_hash',
  'token',
])

/**
 * Substitui campos sensíveis por '[REDACTED]' antes de logar.
 * Percorre recursivamente objetos e arrays.
 */
export function maskSensitive(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj
  if (typeof obj !== 'object') return obj

  if (Array.isArray(obj)) {
    return obj.map(maskSensitive)
  }

  const result: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    result[key] = SENSITIVE_KEYS.has(key) ? '[REDACTED]' : maskSensitive(val)
  }
  return result
}

/**
 * Em produção, evita vazar stack traces e detalhes internos do objeto `Error` nos logs.
 * Em dev, loga o erro completo com máscara PII.
 */
export function logServerError(scope: string, error: unknown): void {
  if (process.env.NODE_ENV === 'production') {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(scope, msg)
  } else {
    const masked = error instanceof Error
      ? { message: error.message, stack: error.stack }
      : maskSensitive(error)
    console.error(scope, masked)
  }
}
