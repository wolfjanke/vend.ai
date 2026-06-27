import { afterEach, describe, expect, it, vi } from 'vitest'
import { checkRateLimit, _resetInMemoryBucketsForTests, resolveRateLimitIp } from '@/lib/rate-limit'

describe('checkRateLimit (in-memory fallback)', () => {
  afterEach(() => {
    _resetInMemoryBucketsForTests()
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('permite requisições até o limite', async () => {
    const key = 'test:key'
    const limit = 3
    const window = 60_000

    expect(await checkRateLimit(key, limit, window)).toBe(true)
    expect(await checkRateLimit(key, limit, window)).toBe(true)
    expect(await checkRateLimit(key, limit, window)).toBe(true)
    expect(await checkRateLimit(key, limit, window)).toBe(false)
  })

  it('usa chaves independentes', async () => {
    expect(await checkRateLimit('a', 1, 60_000)).toBe(true)
    expect(await checkRateLimit('a', 1, 60_000)).toBe(false)
    expect(await checkRateLimit('b', 1, 60_000)).toBe(true)
  })

  it('alerta uma vez em produção sem Upstash', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await checkRateLimit('prod:key', 5, 60_000)
    await checkRateLimit('prod:key', 5, 60_000)

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]?.[0]).toContain('UPSTASH_REDIS_REST_URL')
  })
})

describe('resolveRateLimitIp', () => {
  afterEach(() => {
    _resetInMemoryBucketsForTests()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('retorna IP dos headers quando disponível', () => {
    const req = new Request('https://example.com', {
      headers: { 'x-forwarded-for': '203.0.113.1, 10.0.0.1' },
    })
    expect(resolveRateLimitIp(req)).toBe('203.0.113.1')
  })

  it('deriva bucket por User-Agent quando IP unknown', () => {
    const req = new Request('https://example.com', {
      headers: { 'user-agent': 'TestBrowser/1.0' },
    })
    const bucket = resolveRateLimitIp(req)
    expect(bucket).toMatch(/^unknown:ua:/)
    expect(resolveRateLimitIp(req)).toBe(bucket)
  })

  it('usa anonymous quando IP e User-Agent ausentes', () => {
    const req = new Request('https://example.com')
    expect(resolveRateLimitIp(req)).toBe('unknown:anonymous')
  })

  it('alerta uma vez em produção sem IP identificável', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const req = new Request('https://example.com', {
      headers: { 'user-agent': 'Bot/1' },
    })
    resolveRateLimitIp(req)
    resolveRateLimitIp(req)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]?.[0]).toContain('IP não identificado')
  })
})
