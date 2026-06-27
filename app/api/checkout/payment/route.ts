import { NextRequest, NextResponse } from 'next/server'
import { resolveRateLimitIp } from '@/lib/rate-limit'
import {
  checkCheckoutCreateIpRateLimit,
  checkCheckoutCreateStoreRateLimit,
} from '@/lib/public-rate-limit'
import { handleCheckoutCreate } from '@/lib/checkout/handlers'
export { dynamic } from '@/lib/route-dynamic'

/** @deprecated Use POST /api/checkout/[slug]/create */
export async function POST(req: NextRequest) {
  const ip = resolveRateLimitIp(req)

  if (!(await checkCheckoutCreateIpRateLimit(ip))) {
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

  if (!(await checkCheckoutCreateStoreRateLimit(parsed.storeSlug))) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde e tente novamente.' }, { status: 429 })
  }

  return handleCheckoutCreate(parsed.storeSlug, body)
}
