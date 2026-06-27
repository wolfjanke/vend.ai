import { describe, expect, it } from 'vitest'
import { isPasswordChangeAfterTokenIssued } from '@/lib/session-revocation'

describe('isPasswordChangeAfterTokenIssued', () => {
  it('retorna false sem password_changed_at', () => {
    expect(isPasswordChangeAfterTokenIssued(null, 1_700_000_000)).toBe(false)
    expect(isPasswordChangeAfterTokenIssued(undefined, 1_700_000_000)).toBe(false)
  })

  it('retorna false sem iat no token', () => {
    expect(isPasswordChangeAfterTokenIssued('2024-06-01T12:00:00Z', undefined)).toBe(false)
  })

  it('revoga quando senha foi alterada depois da emissão do JWT', () => {
    const iat = Math.floor(new Date('2024-06-01T10:00:00Z').getTime() / 1000)
    const changedAt = '2024-06-01T12:00:00Z'
    expect(isPasswordChangeAfterTokenIssued(changedAt, iat)).toBe(true)
  })

  it('mantém sessão quando JWT foi emitido após a troca de senha', () => {
    const iat = Math.floor(new Date('2024-06-01T14:00:00Z').getTime() / 1000)
    const changedAt = '2024-06-01T12:00:00Z'
    expect(isPasswordChangeAfterTokenIssued(changedAt, iat)).toBe(false)
  })
})
