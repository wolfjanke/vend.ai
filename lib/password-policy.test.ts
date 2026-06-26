import { describe, expect, it } from 'vitest'
import { passwordSchema, PASSWORD_MIN_LENGTH } from '@/lib/password-policy'

describe('passwordSchema', () => {
  it('rejeita senha curta', () => {
    expect(passwordSchema.safeParse('1234567').success).toBe(false)
  })

  it('aceita senha com tamanho mínimo', () => {
    expect(passwordSchema.safeParse('a'.repeat(PASSWORD_MIN_LENGTH)).success).toBe(true)
  })
})
