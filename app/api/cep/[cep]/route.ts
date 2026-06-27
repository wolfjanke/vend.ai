import { NextRequest, NextResponse } from 'next/server'
import { digitsOnly } from '@/lib/masks'
import { checkRateLimit, resolveRateLimitIp } from '@/lib/rate-limit'
import { CEP_IP_LIMIT, CEP_IP_WINDOW_MS } from '@/lib/rate-limit-config'
import { logServerError } from '@/lib/logger'
export { dynamic } from '@/lib/route-dynamic'

export async function GET(req: NextRequest, { params }: { params: { cep: string } }) {
  const ip = resolveRateLimitIp(req)
  if (!(await checkRateLimit(`cep:ip:${ip}`, CEP_IP_LIMIT, CEP_IP_WINDOW_MS))) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde um momento.' }, { status: 429 })
  }

  const cep = digitsOnly(params.cep)
  if (cep.length !== 8) {
    return NextResponse.json({ error: 'CEP inválido' }, { status: 400 })
  }

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      next: { revalidate: 86_400 },
    })
    const data = await res.json()
    if (!res.ok || data.erro) {
      return NextResponse.json({ error: 'CEP não encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      logradouro: data.logradouro ?? '',
      bairro:     data.bairro ?? '',
      cidade:     data.localidade ?? '',
      uf:         String(data.uf ?? '').toUpperCase(),
    })
  } catch (error) {
    logServerError('[GET /api/cep/[cep]]', error)
    return NextResponse.json({ error: 'Erro ao buscar CEP' }, { status: 502 })
  }
}
