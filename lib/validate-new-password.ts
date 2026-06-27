import { passwordSchema } from '@/lib/password-policy'
import {
  checkPasswordPwned,
  HIBP_UNAVAILABLE_MESSAGE,
  PWNED_PASSWORD_MESSAGE,
} from '@/lib/password-pwned'

export type PasswordValidationResult =
  | { ok: true }
  | { ok: false; error: string }

/** Política local + HIBP (fail-closed em produção se a API não responder). */
export async function validateNewPassword(password: string): Promise<PasswordValidationResult> {
  const parsed = passwordSchema.safeParse(password)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Senha inválida' }
  }

  const pwned = await checkPasswordPwned(password)
  if (pwned === 'pwned') {
    return { ok: false, error: PWNED_PASSWORD_MESSAGE }
  }
  if (pwned === 'unavailable' && process.env.NODE_ENV === 'production') {
    return { ok: false, error: HIBP_UNAVAILABLE_MESSAGE }
  }

  return { ok: true }
}
