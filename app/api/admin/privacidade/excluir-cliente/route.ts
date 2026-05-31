import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sql } from '@/lib/db'
import { getSessionSafe } from '@/lib/auth'
import { digitsOnly } from '@/lib/masks'
import { logServerError } from '@/lib/logger'

const schema = z.object({
  customerWhatsapp: z.string().min(10).max(20),
})

const ANON_NAME = 'Titular removido (LGPD)'

export async function POST(req: NextRequest) {
  const session = await getSessionSafe()
  if (!session?.storeId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'WhatsApp inválido' }, { status: 400 })
    }

    const phone = digitsOnly(parsed.data.customerWhatsapp)

    const result = await sql`
      UPDATE orders
      SET
        customer_name = ${ANON_NAME},
        customer_whatsapp = '***',
        notes = COALESCE(notes, '') || E'\n[LGPD] Anonimizado pelo lojista em ' || NOW()::text,
        delivery_address = NULL
      WHERE store_id = ${session.storeId}
        AND regexp_replace(customer_whatsapp, '\\D', '', 'g') = ${phone}
      RETURNING id
    `

    return NextResponse.json({
      ok:      true,
      updated: result.length,
    })
  } catch (error) {
    logServerError('[admin/privacidade/excluir-cliente]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
