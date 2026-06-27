import { describe, expect, it } from 'vitest'
import {
  isTokenSessionVersionStale,
  normalizeTokenSessionVersion,
} from '@/lib/session-version'

describe('normalizeTokenSessionVersion', () => {
  it('trata ausência como versão 1', () => {
    expect(normalizeTokenSessionVersion(undefined)).toBe(1)
    expect(normalizeTokenSessionVersion(Number.NaN)).toBe(1)
  })
})

describe('isTokenSessionVersionStale', () => {
  it('JWT legado sem sessionVer invalida após bump global (current > 1)', () => {
    expect(isTokenSessionVersionStale(undefined, 5)).toBe(true)
  })

  it('JWT legado permanece válido enquanto versão no banco for 1', () => {
    expect(isTokenSessionVersionStale(undefined, 1)).toBe(false)
  })

  it('invalida quando versão do token é menor que a atual', () => {
    expect(isTokenSessionVersionStale(2, 3)).toBe(true)
  })

  it('mantém sessão quando versões coincidem', () => {
    expect(isTokenSessionVersionStale(3, 3)).toBe(false)
  })
})
