import { describe, expect, it } from 'vitest'
import { normalizeEmail } from '@/lib/email-normalize'

describe('email verification flow helpers', () => {
  it('normalizeEmail usado no resend', () => {
    expect(normalizeEmail('  Test@Example.com ')).toBe('test@example.com')
  })
})
