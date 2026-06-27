import { NextRequest, NextResponse } from 'next/server'
import { resolveRateLimitIp } from '@/lib/rate-limit'
import {
  checkCheckoutCreateIpRateLimit,
  checkCheckoutCreateStoreRateLimit,
} from '@/lib/public-rate-limit'
import { handleCheckoutCreate } from '@/lib/checkout/handlers'
export { dynamic } from '@/lib/route-dynamic'

interface RouteParams {
  params: { slug: string }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const ip = resolveRateLimitIp(req)

  if (!(await checkCheckoutCreateIpRateLimit(ip))) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde 1 minuto.' }, { status: 429 })
  }

  if (!(await checkCheckoutCreateStoreRateLimit(params.slug))) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde e tente novamente.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  return handleCheckoutCreate(params.slug, body)
}
