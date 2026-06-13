import { NextRequest, NextResponse } from 'next/server'
import { logServerError } from '@/lib/logger'
import { anonymizeStaleCustomerData } from '@/lib/lgpd'
export { dynamic } from '@/lib/route-dynamic'


/** Cron: anonimiza pedidos de clientes após prazo de retenção (24 meses). */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET não configurado' }, { status: 503 })
  }

  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { updated } = await anonymizeStaleCustomerData()
    return NextResponse.json({ ok: true, updated })
  } catch (error) {
    logServerError('[cron/lgpd-retention]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
