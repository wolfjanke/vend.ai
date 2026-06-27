import { afterEach, describe, expect, it } from 'vitest'
import { _resetInMemoryBucketsForTests } from '@/lib/rate-limit'
import {
  checkSubscriptionPostRateLimit,
  checkPdvLinkPostRateLimit,
  checkSubaccountPostRateLimit,
  SUBSCRIPTION_POST_LIMIT,
  PDV_LINK_POST_LIMIT,
  SUBACCOUNT_POST_LIMIT,
} from '@/lib/billing-rate-limit'

describe('checkSubscriptionPostRateLimit', () => {
  afterEach(() => {
    _resetInMemoryBucketsForTests()
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('bloqueia após exceder limite por loja', async () => {
    const storeId = 'store-sub-1'
    for (let i = 0; i < SUBSCRIPTION_POST_LIMIT; i++) {
      expect(await checkSubscriptionPostRateLimit(storeId)).toBe(true)
    }
    expect(await checkSubscriptionPostRateLimit(storeId)).toBe(false)
  })

  it('usa chaves de loja independentes', async () => {
    for (let i = 0; i < SUBSCRIPTION_POST_LIMIT; i++) {
      expect(await checkSubscriptionPostRateLimit('store-a')).toBe(true)
    }
    expect(await checkSubscriptionPostRateLimit('store-a')).toBe(false)
    expect(await checkSubscriptionPostRateLimit('store-b')).toBe(true)
  })
})

describe('checkPdvLinkPostRateLimit', () => {
  afterEach(() => {
    _resetInMemoryBucketsForTests()
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('bloqueia após exceder limite por loja', async () => {
    const storeId = 'store-pdv-1'
    for (let i = 0; i < PDV_LINK_POST_LIMIT; i++) {
      expect(await checkPdvLinkPostRateLimit(storeId)).toBe(true)
    }
    expect(await checkPdvLinkPostRateLimit(storeId)).toBe(false)
  })
})

describe('checkSubaccountPostRateLimit', () => {
  afterEach(() => {
    _resetInMemoryBucketsForTests()
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('bloqueia após exceder limite por loja', async () => {
    const storeId = 'store-subaccount-1'
    for (let i = 0; i < SUBACCOUNT_POST_LIMIT; i++) {
      expect(await checkSubaccountPostRateLimit(storeId)).toBe(true)
    }
    expect(await checkSubaccountPostRateLimit(storeId)).toBe(false)
  })

  it('usa chaves de loja independentes', async () => {
    for (let i = 0; i < SUBACCOUNT_POST_LIMIT; i++) {
      expect(await checkSubaccountPostRateLimit('store-x')).toBe(true)
    }
    expect(await checkSubaccountPostRateLimit('store-x')).toBe(false)
    expect(await checkSubaccountPostRateLimit('store-y')).toBe(true)
  })
})
