import { describe, expect, it } from 'vitest'
import { normalizeEmail } from '@/lib/email-normalize'

describe('normalizeEmail', () => {
  it('trim e lowercase', () => {
    expect(normalizeEmail('  User@Mail.COM  ')).toBe('user@mail.com')
  })
})
