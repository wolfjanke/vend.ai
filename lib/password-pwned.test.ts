import { describe, expect, it, vi, afterEach } from 'vitest'
import { checkPasswordPwned, isPasswordPwned } from '@/lib/password-pwned'

describe('checkPasswordPwned', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('detecta senha conhecida no vazamento (password)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        text: async () => '1E4C9B93F3F0682250B6CF8331B7EE68FD8:3861493\n',
      })),
    )

    expect(await checkPasswordPwned('password')).toBe('pwned')
    expect(await isPasswordPwned('password')).toBe(true)
  })

  it('retorna clean quando sufixo não está na lista', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        text: async () => 'AAAA:1\n',
      })),
    )

    expect(await checkPasswordPwned('senha123')).toBe('clean')
  })

  it('retorna unavailable quando a API falha', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 503, text: async () => '' })),
    )

    expect(await checkPasswordPwned('qualquerCoisa1')).toBe('unavailable')
    expect(await isPasswordPwned('qualquerCoisa1')).toBe(false)
  })
})
