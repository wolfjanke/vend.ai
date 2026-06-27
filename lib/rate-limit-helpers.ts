import { checkRateLimit } from '@/lib/rate-limit'

export function normalizeEmailForRateLimit(email: string): string {
  return email.trim().toLowerCase()
}

/** Chave `{scope}:ip:{ip}` — ex.: scope `auth:login` */
export async function checkIpRateLimit(
  scope: string,
  ip: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  return checkRateLimit(`${scope}:ip:${ip}`, limit, windowMs)
}

/** Chave `{scope}:email:{email}` — e-mail normalizado */
export async function checkEmailRateLimit(
  scope: string,
  email: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  return checkRateLimit(
    `${scope}:email:${normalizeEmailForRateLimit(email)}`,
    limit,
    windowMs,
  )
}

/** Chave `{prefix}:{storeId}` — ex.: prefix `upload`, `billing:subscription` */
export async function checkStoreRateLimit(
  prefix: string,
  storeId: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  return checkRateLimit(`${prefix}:${storeId}`, limit, windowMs)
}

/** Chave `{scope}:{userId}` — ex.: scope `auth:change-pwd` */
export async function checkUserRateLimit(
  scope: string,
  userId: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  return checkRateLimit(`${scope}:${userId}`, limit, windowMs)
}

/** Chave `{scope}:{id}` genérica (paymentId, slug, etc.) */
export async function checkScopedRateLimit(
  scope: string,
  id: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  return checkRateLimit(`${scope}:${id}`, limit, windowMs)
}
