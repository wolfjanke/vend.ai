import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const buckets = new Map<string, { count: number; resetAt: number }>()

/** Cache de limiters Upstash por (limit, windowMs). */
const upstashLimiters = new Map<string, Ratelimit>()

let warnedMissingUpstash = false
let lastUpstashErrorLogAt = 0

const UPSTASH_ERROR_LOG_INTERVAL_MS = 60_000

function isUpstashConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  )
}

function warnMissingUpstashInProd(): void {
  if (process.env.NODE_ENV !== 'production' || warnedMissingUpstash) return
  warnedMissingUpstash = true
  console.warn(
    '[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN ausentes em produção — fallback in-memory (não distribuído entre instâncias)',
  )
}

function warnUpstashFallback(error: unknown): void {
  const now = Date.now()
  if (now - lastUpstashErrorLogAt < UPSTASH_ERROR_LOG_INTERVAL_MS) return
  lastUpstashErrorLogAt = now
  const detail = error instanceof Error ? error.message : String(error)
  console.warn('[rate-limit] Upstash indisponível; fallback in-memory:', detail)
}

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
    warnMissingUpstashInProd()
    return checkRateLimitInMemory(key, limit, windowMs)
  }

  try {
    const { success } = await limiter.limit(key)
    return success
  } catch (error) {
    warnUpstashFallback(error)
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

let warnedUnknownIp = false

function hashUserAgent(ua: string): string {
  let h = 0
  for (let i = 0; i < ua.length; i++) {
    h = ((h << 5) - h + ua.charCodeAt(i)) | 0
  }
  return Math.abs(h).toString(36)
}

/**
 * IP para chaves de rate limit. Se o IP não puder ser determinado, deriva um
 * bucket a partir do User-Agent em vez de compartilhar um único `unknown`.
 */
export function resolveRateLimitIp(req: Request): string {
  const ip = clientIp(req)
  if (ip !== 'unknown') return ip

  const ua = req.headers.get('user-agent')?.trim() ?? ''
  if (process.env.NODE_ENV === 'production' && !warnedUnknownIp) {
    warnedUnknownIp = true
    console.warn(
      '[rate-limit] IP não identificado (sem x-forwarded-for/x-real-ip); bucket por User-Agent',
    )
  }

  if (!ua) return 'unknown:anonymous'
  return `unknown:ua:${hashUserAgent(ua)}`
}

/** Expõe fallback in-memory e flags de alerta para testes. */
export function _resetInMemoryBucketsForTests(): void {
  buckets.clear()
  warnedMissingUpstash = false
  warnedUnknownIp = false
  lastUpstashErrorLogAt = 0
  upstashLimiters.clear()
}

/** Indica se Upstash está configurado (útil em health checks internos). */
export function isDistributedRateLimitEnabled(): boolean {
  return isUpstashConfigured()
}
