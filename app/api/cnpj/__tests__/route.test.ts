import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue(true),
  clientIp: () => '127.0.0.1',
}))

describe('GET /api/cnpj/[cnpj]', () => {
  const origFetch = global.fetch

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    global.fetch = origFetch
    vi.restoreAllMocks()
  })

  it('retorna 400 para CNPJ curto', async () => {
    const { GET } = await import('@/app/api/cnpj/[cnpj]/route')
    const res = await GET(new NextRequest('http://localhost/api/cnpj/123'), {
      params: { cnpj: '123' },
    })
    expect(res.status).toBe(400)
  })

  it('normaliza resposta da Brasil API', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        razao_social: 'Empresa Teste LTDA',
        nome_fantasia: 'Empresa Teste',
        cep: '01310100',
        logradouro: 'Av Paulista',
        numero: '1000',
        bairro: 'Bela Vista',
        municipio: 'São Paulo',
        uf: 'sp',
      }),
    }) as unknown as typeof fetch

    const { GET } = await import('@/app/api/cnpj/[cnpj]/route')
    const res = await GET(new NextRequest('http://localhost/api/cnpj/04252011000110'), {
      params: { cnpj: '04252011000110' },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.razaoSocial).toBe('Empresa Teste LTDA')
    expect(body.cep).toBe('01310-100')
    expect(body.uf).toBe('SP')
  })
})
