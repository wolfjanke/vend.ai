import { afterEach, describe, expect, it } from 'vitest'
import { _resetInMemoryBucketsForTests } from '@/lib/rate-limit'
import {
  checkLoginRateLimit,
  checkForgotPasswordEmailRateLimit,
  checkForgotPasswordIpRateLimit,
  checkResendVerificationEmailRateLimit,
  checkResendVerificationIpRateLimit,
  checkChangePasswordRateLimit,
  checkVerifyEmailIpRateLimit,
  checkRegisterIpRateLimit,
  checkRegisterEmailRateLimit,
  LOGIN_IP_LIMIT,
  FORGOT_PASSWORD_EMAIL_LIMIT,
  FORGOT_PASSWORD_IP_LIMIT,
  RESEND_VERIFY_EMAIL_LIMIT,
  RESEND_VERIFY_IP_LIMIT,
  CHANGE_PASSWORD_LIMIT,
  VERIFY_EMAIL_IP_LIMIT,
  REGISTER_IP_LIMIT,
  REGISTER_EMAIL_LIMIT,
} from '@/lib/auth-rate-limit'

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

describe('checkForgotPasswordIpRateLimit', () => {
  afterEach(() => {
    _resetInMemoryBucketsForTests()
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('bloqueia após exceder limite por IP', async () => {
    const ip = 'forgot-ip-block'
    for (let i = 0; i < FORGOT_PASSWORD_IP_LIMIT; i++) {
      expect(await checkForgotPasswordIpRateLimit(ip)).toBe(true)
    }
    expect(await checkForgotPasswordIpRateLimit(ip)).toBe(false)
  })
})

describe('checkForgotPasswordEmailRateLimit', () => {
  afterEach(() => {
    _resetInMemoryBucketsForTests()
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('bloqueia após exceder limite por e-mail', async () => {
    const email = 'vitima@example.com'
    for (let i = 0; i < FORGOT_PASSWORD_EMAIL_LIMIT; i++) {
      expect(await checkForgotPasswordEmailRateLimit(email)).toBe(true)
    }
    expect(await checkForgotPasswordEmailRateLimit(email)).toBe(false)
  })

  it('usa chaves de e-mail independentes', async () => {
    for (let i = 0; i < FORGOT_PASSWORD_EMAIL_LIMIT; i++) {
      expect(await checkForgotPasswordEmailRateLimit('a@example.com')).toBe(true)
    }
    expect(await checkForgotPasswordEmailRateLimit('a@example.com')).toBe(false)
    expect(await checkForgotPasswordEmailRateLimit('b@example.com')).toBe(true)
  })
})

describe('checkResendVerificationIpRateLimit', () => {
  afterEach(() => {
    _resetInMemoryBucketsForTests()
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('bloqueia após exceder limite por IP', async () => {
    const ip = 'resend-ip-block'
    for (let i = 0; i < RESEND_VERIFY_IP_LIMIT; i++) {
      expect(await checkResendVerificationIpRateLimit(ip)).toBe(true)
    }
    expect(await checkResendVerificationIpRateLimit(ip)).toBe(false)
  })
})

describe('checkResendVerificationEmailRateLimit', () => {
  afterEach(() => {
    _resetInMemoryBucketsForTests()
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('bloqueia após exceder limite por e-mail', async () => {
    const email = 'nao-verificado@example.com'
    for (let i = 0; i < RESEND_VERIFY_EMAIL_LIMIT; i++) {
      expect(await checkResendVerificationEmailRateLimit(email)).toBe(true)
    }
    expect(await checkResendVerificationEmailRateLimit(email)).toBe(false)
  })

  it('permite e-mails diferentes com IPs diferentes', async () => {
    for (let i = 0; i < RESEND_VERIFY_EMAIL_LIMIT; i++) {
      expect(await checkResendVerificationEmailRateLimit('a@example.com')).toBe(true)
    }
    expect(await checkResendVerificationEmailRateLimit('a@example.com')).toBe(false)
    expect(await checkResendVerificationEmailRateLimit('b@example.com')).toBe(true)
  })
})

describe('checkChangePasswordRateLimit', () => {
  afterEach(() => {
    _resetInMemoryBucketsForTests()
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('bloqueia após exceder limite por usuário', async () => {
    const userId = 'user-change-pwd-1'
    for (let i = 0; i < CHANGE_PASSWORD_LIMIT; i++) {
      expect(await checkChangePasswordRateLimit(userId)).toBe(true)
    }
    expect(await checkChangePasswordRateLimit(userId)).toBe(false)
  })

  it('usa chaves de usuário independentes', async () => {
    for (let i = 0; i < CHANGE_PASSWORD_LIMIT; i++) {
      expect(await checkChangePasswordRateLimit('user-a')).toBe(true)
    }
    expect(await checkChangePasswordRateLimit('user-a')).toBe(false)
    expect(await checkChangePasswordRateLimit('user-b')).toBe(true)
  })
})

describe('checkVerifyEmailIpRateLimit', () => {
  afterEach(() => {
    _resetInMemoryBucketsForTests()
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('bloqueia após exceder limite por IP', async () => {
    const ip = 'verify-email-ip'
    for (let i = 0; i < VERIFY_EMAIL_IP_LIMIT; i++) {
      expect(await checkVerifyEmailIpRateLimit(ip)).toBe(true)
    }
    expect(await checkVerifyEmailIpRateLimit(ip)).toBe(false)
  })
})

describe('checkRegisterIpRateLimit', () => {
  afterEach(() => {
    _resetInMemoryBucketsForTests()
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('bloqueia após exceder limite por IP', async () => {
    const ip = 'register-ip-block'
    for (let i = 0; i < REGISTER_IP_LIMIT; i++) {
      expect(await checkRegisterIpRateLimit(ip)).toBe(true)
    }
    expect(await checkRegisterIpRateLimit(ip)).toBe(false)
  })
})

describe('checkRegisterEmailRateLimit', () => {
  afterEach(() => {
    _resetInMemoryBucketsForTests()
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('bloqueia após exceder limite por e-mail', async () => {
    const email = 'novo@example.com'
    for (let i = 0; i < REGISTER_EMAIL_LIMIT; i++) {
      expect(await checkRegisterEmailRateLimit(email)).toBe(true)
    }
    expect(await checkRegisterEmailRateLimit(email)).toBe(false)
  })

  it('permite e-mails diferentes', async () => {
    for (let i = 0; i < REGISTER_EMAIL_LIMIT; i++) {
      expect(await checkRegisterEmailRateLimit('a@example.com')).toBe(true)
    }
    expect(await checkRegisterEmailRateLimit('a@example.com')).toBe(false)
    expect(await checkRegisterEmailRateLimit('b@example.com')).toBe(true)
  })
})
