import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const buckets = new Map<string, { count: number; resetAt: number }>()

/** Cache de limiters Upstash por (limit, windowMs). */
const upstashLimiters = new Map<string, Ratelimit>()

function getUpstashLimiter(limit: number, windowMs: number): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (!url || !token) return null

  const cacheKey = `${limit}:${windowMs}`
  let limiter = upstashLimiters.get(cacheKey)
  if (!limiter) {
    limiter = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      prefix: 'vendai:rl',
    })
    upstashLimiters.set(cacheKey, limiter)
  }
  return limiter
}

function checkRateLimitInMemory(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now()
  const entry = buckets.get(key)

  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) return false
  entry.count++
  return true
}

/**
 * Rate limit distribuído (Upstash) com fallback in-memory para dev local.
 * Retorna true se a requisição está dentro do limite.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  const limiter = getUpstashLimiter(limit, windowMs)
  if (!limiter) {
    return checkRateLimitInMemory(key, limit, windowMs)
  }

  try {
    const { success } = await limiter.limit(key)
    return success
  } catch {
    return checkRateLimitInMemory(key, limit, windowMs)
  }
}

export function clientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

/** Expõe fallback in-memory para testes. */
export function _resetInMemoryBucketsForTests(): void {
  buckets.clear()
}
