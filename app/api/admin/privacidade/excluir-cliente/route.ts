import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireSession } from '@/lib/require-session'
import { digitsOnly } from '@/lib/masks'
import { logServerError } from '@/lib/logger'
import { anonymizeCustomerOrders } from '@/lib/lgpd'
import { checkLgpdAdminAnonymizeRateLimit } from '@/lib/store-rate-limit'
export { dynamic } from '@/lib/route-dynamic'


const schema = z.object({
  customerWhatsapp: z.string().min(10).max(20),
})

export async function POST(req: NextRequest) {
  const { session, unauthorized } = await requireSession()
  if (!session) return unauthorized!

  if (!(await checkLgpdAdminAnonymizeRateLimit(session.storeId))) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde e tente novamente.' },
      { status: 429 },
    )
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
