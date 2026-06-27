import crypto from 'crypto'

export const PWNED_PASSWORD_MESSAGE =
  'Esta senha apareceu em vazamentos conhecidos. Escolha outra senha.'

export const HIBP_UNAVAILABLE_MESSAGE =
  'Não foi possível validar a senha agora. Tente novamente em instantes.'

const HIBP_RANGE_URL = 'https://api.pwnedpasswords.com/range'
const REQUEST_TIMEOUT_MS = 5_000

export type PwnedCheckResult = 'clean' | 'pwned' | 'unavailable'

/**
 * Verifica senha na API k-anonymity do Have I Been Pwned.
 * Retorna `unavailable` se a API falhar (fail-closed em produção via validateNewPassword).
 */
export async function checkPasswordPwned(password: string): Promise<PwnedCheckResult> {
  const sha1 = crypto.createHash('sha1').update(password, 'utf8').digest('hex').toUpperCase()
  const prefix = sha1.slice(0, 5)
  const suffix = sha1.slice(5)

  try {
    const res = await fetch(`${HIBP_RANGE_URL}/${prefix}`, {
      headers: { 'Add-Padding': 'true' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: 'no-store',
    })
    if (!res.ok) {
      console.warn('[password-pwned] HIBP respondeu', res.status)
      return 'unavailable'
    }

    const body = await res.text()
    const pwned = body.split('\n').some(line => {
      const [hashSuffix] = line.trim().split(':')
      return hashSuffix === suffix
    })
    return pwned ? 'pwned' : 'clean'
  } catch (e) {
    console.warn('[password-pwned] HIBP indisponível:', e instanceof Error ? e.message : e)
    return 'unavailable'
  }
}

/** @deprecated Use checkPasswordPwned */
export async function isPasswordPwned(password: string): Promise<boolean> {
  const result = await checkPasswordPwned(password)
  return result === 'pwned'
}
