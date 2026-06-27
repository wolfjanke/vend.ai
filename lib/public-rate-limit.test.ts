import { afterEach, describe, expect, it } from 'vitest'
import { _resetInMemoryBucketsForTests } from '@/lib/rate-limit'
import {
  checkCheckoutCreateStoreRateLimit,
  checkCheckoutStatusRateLimit,
  checkLojaGetIpRateLimit,
  CHECKOUT_CREATE_STORE_LIMIT,
  CHECKOUT_STATUS_LIMIT,
  LOJA_GET_IP_LIMIT,
} from '@/lib/public-rate-limit'

describe('checkCheckoutStatusRateLimit', () => {
  afterEach(() => {
    _resetInMemoryBucketsForTests()
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('bloqueia após exceder limite por pagamento', async () => {
    const paymentId = 'pay_123'
    for (let i = 0; i < CHECKOUT_STATUS_LIMIT; i++) {
      expect(await checkCheckoutStatusRateLimit(paymentId)).toBe(true)
    }
    expect(await checkCheckoutStatusRateLimit(paymentId)).toBe(false)
  })
})

describe('checkLojaGetIpRateLimit', () => {
  afterEach(() => {
    _resetInMemoryBucketsForTests()
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('bloqueia após exceder limite por IP', async () => {
    const ip = 'loja-scraper-ip'
    for (let i = 0; i < LOJA_GET_IP_LIMIT; i++) {
      expect(await checkLojaGetIpRateLimit(ip)).toBe(true)
    }
    expect(await checkLojaGetIpRateLimit(ip)).toBe(false)
  })
})

describe('checkCheckoutCreateStoreRateLimit', () => {
  afterEach(() => {
    _resetInMemoryBucketsForTests()
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('bloqueia após exceder limite por loja', async () => {
    const slug = 'minha-loja'
    for (let i = 0; i < CHECKOUT_CREATE_STORE_LIMIT; i++) {
      expect(await checkCheckoutCreateStoreRateLimit(slug)).toBe(true)
    }
    expect(await checkCheckoutCreateStoreRateLimit(slug)).toBe(false)
  })
})
