import { describe, expect, it } from 'vitest'
import { lgpdExclusaoSchema } from '@/lib/validations'

describe('lgpdExclusaoSchema', () => {
  it('aceita pedido com 4 dígitos', () => {
    const r = lgpdExclusaoSchema.safeParse({
      storeSlug:          'minha-loja',
      customerWhatsapp:   '41999998888',
      orderNumber:        '1234',
    })
    expect(r.success).toBe(true)
  })

  it('rejeita pedido com formato inválido', () => {
    const r = lgpdExclusaoSchema.safeParse({
      storeSlug:          'minha-loja',
      customerWhatsapp:   '41999998888',
      orderNumber:        '12',
    })
    expect(r.success).toBe(false)
  })
})
