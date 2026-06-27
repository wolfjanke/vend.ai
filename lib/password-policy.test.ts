import { describe, expect, it } from 'vitest'
import {
  meetsPasswordComplexity,
  passwordComplexityScore,
  passwordSchema,
  PASSWORD_MIN_LENGTH,
} from '@/lib/password-policy'

describe('passwordComplexityScore', () => {
  it('conta categorias distintas', () => {
    expect(passwordComplexityScore('Aa1!')).toBe(4)
    expect(passwordComplexityScore('password1')).toBe(2)
    expect(passwordComplexityScore('aaaaaaaa')).toBe(1)
  })
})

describe('passwordSchema', () => {
  it('rejeita senha curta', () => {
    expect(passwordSchema.safeParse('1234567').success).toBe(false)
  })

  it('rejeita senha longa só com minúsculas', () => {
    expect(passwordSchema.safeParse('a'.repeat(PASSWORD_MIN_LENGTH)).success).toBe(false)
  })

  it('aceita senha com minúsculas e números', () => {
    expect(passwordSchema.safeParse('senha123').success).toBe(true)
  })

  it('aceita senha com maiúsculas e símbolos', () => {
    expect(passwordSchema.safeParse('Senha!@#').success).toBe(true)
  })
})

describe('meetsPasswordComplexity', () => {
  it('exige ao menos duas categorias', () => {
    expect(meetsPasswordComplexity('abcdefgh')).toBe(false)
    expect(meetsPasswordComplexity('abc12345')).toBe(true)
  })
})
