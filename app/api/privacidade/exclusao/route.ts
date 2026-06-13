import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sql } from '@/lib/db'
import { digitsOnly } from '@/lib/masks'
import { checkRateLimit, clientIp } from '@/lib/rate-limit'
import { logServerError } from '@/lib/logger'
import { anonymizeCustomerOrders } from '@/lib/lgpd'
export { dynamic } from '@/lib/route-dynamic'


const schema = z.object({
  storeSlug:          z.string().min(2).max(40),
  customerWhatsapp:   z.string().min(10).max(20),
})

export async function POST(req: NextRequest) {
  const ip = clientIp(req)
  if (!checkRateLimit(`lgpd:exclusao:${ip}`, 3, 3_600_000)) {
    return NextResponse.json({ error: 'Muitas solicitações. Tente mais tarde.' }, { status: 429 })
  }

  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const { storeSlug, customerWhatsapp } = parsed.data
    const phone = digitsOnly(customerWhatsapp)

    const storeRows = await sql`SELECT id FROM stores WHERE slug = ${storeSlug} LIMIT 1`
    const store = storeRows[0]
    if (!store) {
      return NextResponse.json({ ok: true, message: 'Solicitação registrada.' })
    }

    const { updated } = await anonymizeCustomerOrders(
      store.id as string,
      phone,
      'Anonimizado pelo titular via vitrine',
    )

    return NextResponse.json({
      ok:      true,
      updated,
      message: updated > 0
        ? 'Dados pessoais anonimizados nos pedidos vinculados ao WhatsApp informado.'
        : 'Nenhum pedido encontrado para este WhatsApp. Se você acredita que há erro, contate a loja ou privacidade@vend.ai.',
    })
  } catch (error) {
    logServerError('[POST /api/privacidade/exclusao]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
