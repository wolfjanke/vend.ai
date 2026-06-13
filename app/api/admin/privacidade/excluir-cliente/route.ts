import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionSafe } from '@/lib/auth'
import { digitsOnly } from '@/lib/masks'
import { logServerError } from '@/lib/logger'
import { anonymizeCustomerOrders } from '@/lib/lgpd'
export { dynamic } from '@/lib/route-dynamic'


const schema = z.object({
  customerWhatsapp: z.string().min(10).max(20),
})

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
    const { updated } = await anonymizeCustomerOrders(
      session.storeId,
      phone,
      'Anonimizado pelo lojista',
    )

    return NextResponse.json({ ok: true, updated })
  } catch (error) {
    logServerError('[admin/privacidade/excluir-cliente]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
