import { NextRequest, NextResponse } from 'next/server'
import { digitsOnly } from '@/lib/masks'
import { checkRateLimit, clientIp } from '@/lib/rate-limit'
import { logServerError } from '@/lib/logger'
export { dynamic } from '@/lib/route-dynamic'

const CNPJ_IP_LIMIT = 30
const CNPJ_IP_WINDOW = 60_000

type BrasilApiCnpj = {
  razao_social?: string
  nome_fantasia?: string
  cep?: string
  logradouro?: string
  numero?: string
  bairro?: string
  municipio?: string
  uf?: string
}

export async function GET(req: NextRequest, { params }: { params: { cnpj: string } }) {
  const ip = clientIp(req)
  if (!(await checkRateLimit(`cnpj:ip:${ip}`, CNPJ_IP_LIMIT, CNPJ_IP_WINDOW))) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde um momento.' }, { status: 429 })
  }

  const cnpj = digitsOnly(params.cnpj)
  if (cnpj.length !== 14) {
    return NextResponse.json({ error: 'CNPJ inválido' }, { status: 400 })
  }

  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
      next: { revalidate: 86_400 },
    })
    if (res.status === 404) {
      return NextResponse.json({ error: 'CNPJ não encontrado' }, { status: 404 })
    }
    if (!res.ok) {
      return NextResponse.json({ error: 'Erro ao consultar CNPJ' }, { status: 502 })
    }

    const data = (await res.json()) as BrasilApiCnpj
    const cepDigits = digitsOnly(data.cep ?? '')

    return NextResponse.json({
      razaoSocial:  data.razao_social ?? '',
      nomeFantasia: data.nome_fantasia ?? '',
      cep:          cepDigits.length === 8
        ? `${cepDigits.slice(0, 5)}-${cepDigits.slice(5)}`
        : '',
      logradouro: data.logradouro ?? '',
      numero:     data.numero ?? '',
      bairro:     data.bairro ?? '',
      cidade:     data.municipio ?? '',
      uf:         String(data.uf ?? '').toUpperCase(),
    })
  } catch (error) {
    logServerError('[GET /api/cnpj/[cnpj]]', error)
    return NextResponse.json({ error: 'Erro ao consultar CNPJ' }, { status: 502 })
  }
}
