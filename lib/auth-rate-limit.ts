import { checkRateLimit } from '@/lib/rate-limit'

/** 10 tentativas por IP a cada 15 minutos. */
export const LOGIN_IP_LIMIT = 10
/** 5 tentativas por e-mail a cada 15 minutos. */
export const LOGIN_EMAIL_LIMIT = 5
export const LOGIN_WINDOW_MS = 15 * 60 * 1000

/**
 * Retorna true se o login pode prosseguir; false se excedeu o limite.
 * Conta tentativas por IP e por e-mail (normalizado).
 */
export async function checkLoginRateLimit(
  ip: string,
  email: string,
): Promise<boolean> {
  const normalized = email.trim().toLowerCase()
  const ipOk = await checkRateLimit(`auth:login:ip:${ip}`, LOGIN_IP_LIMIT, LOGIN_WINDOW_MS)
  if (!ipOk) return false
  const emailOk = await checkRateLimit(
    `auth:login:email:${normalized}`,
    LOGIN_EMAIL_LIMIT,
    LOGIN_WINDOW_MS,
  )
  return emailOk
}

/** Limite para POST de redefinição de senha (por IP). */
export const RESET_PASSWORD_IP_LIMIT = 5
export const RESET_PASSWORD_WINDOW_MS = 60 * 60 * 1000

export async function checkResetPasswordRateLimit(ip: string): Promise<boolean> {
  return checkRateLimit(`auth:reset:ip:${ip}`, RESET_PASSWORD_IP_LIMIT, RESET_PASSWORD_WINDOW_MS)
}
