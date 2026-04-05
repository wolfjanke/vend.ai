interface AsaasError {
  status:      number
  code:        string
  description: string
}

export class AsaasApiError extends Error {
  status:      number
  code:        string
  description: string

  constructor(error: AsaasError) {
    super(error.description)
    this.name        = 'AsaasApiError'
    this.status      = error.status
    this.code        = error.code
    this.description = error.description
  }
}

const RETRY_DELAYS = [500, 1000]

export async function asaasFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
  overrideApiKey?: string,
): Promise<T> {
  const apiKey  = overrideApiKey ?? process.env.ASAAS_API_KEY
  const baseUrl = process.env.ASAAS_BASE_URL ?? 'https://sandbox.asaas.com/api/v3'

  if (!apiKey) {
    throw new AsaasApiError({ status: 0, code: 'MISSING_API_KEY', description: 'ASAAS_API_KEY não configurada' })
  }

  const url = `${baseUrl}${path}`

  const headers: Record<string, string> = {
    'Content-Type':  'application/json',
    'access_token':  apiKey,
    'User-Agent':    'vend.ai/1.0',
    ...(options.headers as Record<string, string> ?? {}),
  }

  async function attempt(attempt: number): Promise<T> {
    const res = await fetch(url, { ...options, headers })

    if (res.ok) {
      if (res.status === 204) return undefined as T
      return res.json() as Promise<T>
    }

    const isServerError = res.status >= 500

    let code        = `HTTP_${res.status}`
    let description = res.statusText || 'Erro na API Asaas'

    try {
      const body = await res.json() as { errors?: Array<{ code: string; description: string }> }
      if (body?.errors?.[0]) {
        code        = body.errors[0].code
        description = body.errors[0].description
      }
    } catch {
      // ignora erros de parse do body
    }

    if (isServerError && attempt < RETRY_DELAYS.length) {
      await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt]))
      return attempt_(attempt + 1)
    }

    throw new AsaasApiError({ status: res.status, code, description })
  }

  function attempt_(n: number): Promise<T> {
    return attempt(n)
  }

  return attempt(0)
}
