import { afterEach, describe, expect, it } from 'vitest'
import { _resetInMemoryBucketsForTests } from '@/lib/rate-limit'
import { checkLoginRateLimit, LOGIN_IP_LIMIT } from '@/lib/auth-rate-limit'

describe('checkLoginRateLimit', () => {
  afterEach(() => {
    _resetInMemoryBucketsForTests()
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('bloqueia após exceder limite por IP', async () => {
    const ip = 'test-ip-block'
    for (let i = 0; i < LOGIN_IP_LIMIT; i++) {
      expect(await checkLoginRateLimit(ip, `user${i}@example.com`)).toBe(true)
    }
    expect(await checkLoginRateLimit(ip, 'outro@example.com')).toBe(false)
  })

  it('bloqueia após exceder limite por e-mail', async () => {
    const email = 'mesmo@example.com'
    for (let i = 0; i < 5; i++) {
      expect(await checkLoginRateLimit(`ip-${i}`, email)).toBe(true)
    }
    expect(await checkLoginRateLimit('ip-novo', email)).toBe(false)
  })
})
