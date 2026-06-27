import { describe, expect, it } from 'vitest'
import {
  buildEmailVerifyPageUrl,
  buildPasswordResetPageUrl,
} from '@/lib/auth-token-url'

describe('auth-token-url', () => {
  it('reset: token no fragmento', () => {
    const url = buildPasswordResetPageUrl('https://vendai.club', 'abc')
    expect(url).toBe('https://vendai.club/redefinir-senha#token=abc')
    expect(url).not.toContain('?token=')
  })

  it('verify-email: token no fragmento', () => {
    const url = buildEmailVerifyPageUrl('https://vendai.club/', 'xyz')
    expect(url).toBe('https://vendai.club/verificar-email#token=xyz')
  })
})
