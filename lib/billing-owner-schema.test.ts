import { describe, expect, it } from 'vitest'
import { billingOwnerSchema } from '@/lib/validations'

describe('billingOwnerSchema', () => {
  it('aceita PF com CPF válido', () => {
    const parsed = billingOwnerSchema.safeParse({
      type: 'pf',
      cpfCnpj: '529.982.247-25',
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.cpfCnpj).toBe('52998224725')
    }
  })

  it('rejeita PF com CPF inválido', () => {
    const parsed = billingOwnerSchema.safeParse({
      type: 'pf',
      cpfCnpj: '111.111.111-11',
    })
    expect(parsed.success).toBe(false)
  })

  it('exige razão social para PJ', () => {
    const parsed = billingOwnerSchema.safeParse({
      type: 'pj',
      cpfCnpj: '04.252.011/0001-10',
    })
    expect(parsed.success).toBe(false)
  })

  it('aceita PJ com CNPJ e razão social', () => {
    const parsed = billingOwnerSchema.safeParse({
      type: 'pj',
      cpfCnpj: '04.252.011/0001-10',
      legalName: 'Empresa Teste LTDA',
    })
    expect(parsed.success).toBe(true)
  })

  it('valida endereço parcial quando preenchido', () => {
    const parsed = billingOwnerSchema.safeParse({
      type: 'pf',
      cpfCnpj: '529.982.247-25',
      address: {
        cep: '01310-100',
        logradouro: 'Av Paulista',
        numero: '1000',
        bairro: 'Bela Vista',
        cidade: 'São Paulo',
        uf: 'SP',
      },
    })
    expect(parsed.success).toBe(true)
  })
})
