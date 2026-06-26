import { maskEmailForLog } from '@/lib/mask-email'

/** Log de bloqueio por rate limit no login (sem expor e-mail completo). */
export function logLoginRateLimitBlocked(ip: string, email: string): void {
  console.warn('[auth/login] rate limit', { ip, email: maskEmailForLog(email) })
}
