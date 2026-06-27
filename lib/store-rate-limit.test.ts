import { afterEach, describe, expect, it } from 'vitest'
import { _resetInMemoryBucketsForTests } from '@/lib/rate-limit'
import {
  checkUploadPostRateLimit,
  checkLgpdAdminAnonymizeRateLimit,
  checkPhotoAnalyzeBurstRateLimit,
  UPLOAD_POST_LIMIT,
  LGPD_ADMIN_ANON_LIMIT,
  PHOTO_ANALYZE_BURST_LIMIT,
} from '@/lib/store-rate-limit'

describe('checkUploadPostRateLimit', () => {
  afterEach(() => {
    _resetInMemoryBucketsForTests()
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('bloqueia após exceder limite por loja', async () => {
    const storeId = 'store-upload-1'
    for (let i = 0; i < UPLOAD_POST_LIMIT; i++) {
      expect(await checkUploadPostRateLimit(storeId)).toBe(true)
    }
    expect(await checkUploadPostRateLimit(storeId)).toBe(false)
  })
})

describe('checkLgpdAdminAnonymizeRateLimit', () => {
  afterEach(() => {
    _resetInMemoryBucketsForTests()
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('bloqueia após exceder limite por loja', async () => {
    const storeId = 'store-lgpd-1'
    for (let i = 0; i < LGPD_ADMIN_ANON_LIMIT; i++) {
      expect(await checkLgpdAdminAnonymizeRateLimit(storeId)).toBe(true)
    }
    expect(await checkLgpdAdminAnonymizeRateLimit(storeId)).toBe(false)
  })
})

describe('checkPhotoAnalyzeBurstRateLimit', () => {
  afterEach(() => {
    _resetInMemoryBucketsForTests()
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('bloqueia após exceder burst por loja', async () => {
    const storeId = 'store-photo-1'
    for (let i = 0; i < PHOTO_ANALYZE_BURST_LIMIT; i++) {
      expect(await checkPhotoAnalyzeBurstRateLimit(storeId)).toBe(true)
    }
    expect(await checkPhotoAnalyzeBurstRateLimit(storeId)).toBe(false)
  })
})
