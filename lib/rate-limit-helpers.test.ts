import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  checkEmailRateLimit,
  checkIpRateLimit,
  checkStoreRateLimit,
  normalizeEmailForRateLimit,
} from '@/lib/rate-limit-helpers'
import { _resetInMemoryBucketsForTests } from '@/lib/rate-limit'

describe('normalizeEmailForRateLimit', () => {
  it('normaliza e-mail', () => {
    expect(normalizeEmailForRateLimit('  Foo@Bar.COM  ')).toBe('foo@bar.com')
  })
})

describe('checkIpRateLimit', () => {
  afterEach(() => {
    _resetInMemoryBucketsForTests()
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('bloqueia após exceder limite', async () => {
    const scope = 'test:scope'
    const ip = '1.2.3.4'
    expect(await checkIpRateLimit(scope, ip, 2, 60_000)).toBe(true)
    expect(await checkIpRateLimit(scope, ip, 2, 60_000)).toBe(true)
    expect(await checkIpRateLimit(scope, ip, 2, 60_000)).toBe(false)
  })
})

describe('checkEmailRateLimit', () => {
  afterEach(() => {
    _resetInMemoryBucketsForTests()
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('trata e-mails com case diferente como mesmo bucket', async () => {
    expect(await checkEmailRateLimit('auth:test', 'A@b.com', 1, 60_000)).toBe(true)
    expect(await checkEmailRateLimit('auth:test', 'a@B.COM', 1, 60_000)).toBe(false)
  })
})

describe('checkStoreRateLimit', () => {
  afterEach(() => {
    _resetInMemoryBucketsForTests()
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('usa prefixo e storeId na chave', async () => {
    expect(await checkStoreRateLimit('upload', 'store-1', 1, 60_000)).toBe(true)
    expect(await checkStoreRateLimit('upload', 'store-1', 1, 60_000)).toBe(false)
    expect(await checkStoreRateLimit('upload', 'store-2', 1, 60_000)).toBe(true)
  })
})
