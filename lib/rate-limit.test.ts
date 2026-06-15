import { afterEach, describe, expect, it } from 'vitest'
import { checkRateLimit, _resetInMemoryBucketsForTests } from '@/lib/rate-limit'

describe('checkRateLimit (in-memory fallback)', () => {
  afterEach(() => {
    _resetInMemoryBucketsForTests()
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
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
})
