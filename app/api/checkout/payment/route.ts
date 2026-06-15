import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, clientIp } from '@/lib/rate-limit'
import { handleCheckoutCreate } from '@/lib/checkout/handlers'
export { dynamic } from '@/lib/route-dynamic'

const RATE_LIMIT = 5
const RATE_WINDOW = 60_000

/** @deprecated Use POST /api/checkout/[slug]/create */
export async function POST(req: NextRequest) {
  const ip = clientIp(req)

  if (!(await checkRateLimit(`checkout:ip:${ip}`, RATE_LIMIT, RATE_WINDOW))) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde 1 minuto.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = body as { storeSlug?: string }
  if (!parsed?.storeSlug) {
    return NextResponse.json({ error: 'storeSlug obrigatório' }, { status: 400 })
  }

  return handleCheckoutCreate(parsed.storeSlug, body)
}
