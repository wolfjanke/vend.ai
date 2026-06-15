import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { digitsOnly } from '@/lib/masks'
import { checkRateLimit, clientIp } from '@/lib/rate-limit'
import { logServerError } from '@/lib/logger'
import { anonymizeCustomerOrders } from '@/lib/lgpd'
import { lgpdExclusaoSchema } from '@/lib/validations'
export { dynamic } from '@/lib/route-dynamic'


const GENERIC_OK_MESSAGE =
  'Se os dados estiverem corretos, sua solicitação foi registrada. ' +
  'Em caso de correspondência, os dados serão anonimizados conforme a política de privacidade.'

export async function POST(req: NextRequest) {
  const ip = clientIp(req)
  if (!(await checkRateLimit(`lgpd:exclusao:${ip}`, 3, 3_600_000))) {
    return NextResponse.json({ error: 'Muitas solicitações. Tente mais tarde.' }, { status: 429 })
  }

  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const parsed = lgpdExclusaoSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const { storeSlug, customerWhatsapp, orderNumber } = parsed.data
    const phone = digitsOnly(customerWhatsapp)

    const storeRows = await sql`SELECT id FROM stores WHERE slug = ${storeSlug} LIMIT 1`
    const store = storeRows[0]
    if (!store) {
      return NextResponse.json({ ok: true, message: GENERIC_OK_MESSAGE })
    }

    const storeId = store.id as string
    const orderRows = await sql`
      SELECT id FROM orders
      WHERE store_id = ${storeId}
        AND order_number = ${orderNumber}
        AND regexp_replace(customer_whatsapp, '\\D', '', 'g') = ${phone}
      LIMIT 1
    `

    if (orderRows.length === 0) {
      return NextResponse.json({ ok: true, message: GENERIC_OK_MESSAGE })
    }

    const { updated } = await anonymizeCustomerOrders(
      storeId,
      phone,
      'Anonimizado pelo titular via vitrine (pedido verificado)',
    )

    return NextResponse.json({
      ok:      true,
      updated,
      message: updated > 0
        ? 'Dados pessoais anonimizados nos pedidos vinculados ao WhatsApp informado.'
        : GENERIC_OK_MESSAGE,
    })
  } catch (error) {
    logServerError('[POST /api/privacidade/exclusao]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
