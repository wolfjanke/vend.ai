import { beforeAll, afterAll, describe, expect, it } from 'vitest'
import {
  decryptTaxId,
  encryptTaxId,
  maskTaxIdForDisplay,
} from '@/lib/crypto/pii'

const TEST_KEY = Buffer.alloc(32, 7).toString('base64')

describe('encryptTaxId / decryptTaxId', () => {
  const orig = process.env.SUBACCOUNT_ENCRYPTION_KEY

  beforeAll(() => {
    process.env.SUBACCOUNT_ENCRYPTION_KEY = TEST_KEY
  })

  afterAll(() => {
    process.env.SUBACCOUNT_ENCRYPTION_KEY = orig
  })

  it('criptografa e descriptografa CPF (11 dígitos)', async () => {
    const cpf = '52998224725'
    const enc = await encryptTaxId(cpf)
    expect(enc).not.toBe(cpf)
    expect(await decryptTaxId(enc)).toBe(cpf)
  })

  it('criptografa e descriptografa CNPJ (14 dígitos)', async () => {
    const cnpj = '04252011000110'
    const enc = await encryptTaxId(cnpj)
    expect(enc).not.toBe(cnpj)
    expect(await decryptTaxId(enc)).toBe(cnpj)
  })

  it('rejeita documento com tamanho inválido', async () => {
    await expect(encryptTaxId('123')).rejects.toThrow(/inválido/)
  })
})

describe('maskTaxIdForDisplay', () => {
  it('mascara CPF mantendo últimos dígitos visíveis', () => {
    expect(maskTaxIdForDisplay('pf', '52998224725')).toBe('•••.•••.•••-25')
  })

  it('mascara CNPJ mantendo sufixo visível', () => {
    expect(maskTaxIdForDisplay('pj', '04252011000110')).toBe('••.•••.•••/••••-10')
  })
})
