import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { resendEmailVerification } from '@/lib/email-verification'
import { normalizeEmail } from '@/lib/email-normalize'
import { logServerError } from '@/lib/logger'
import { checkRateLimit, clientIp } from '@/lib/rate-limit'
export { dynamic } from '@/lib/route-dynamic'

const schema = z.object({ email: z.string().email() })

export async function POST(req: NextRequest) {
  const ip = clientIp(req)
  if (!(await checkRateLimit(`auth:resend-verify:${ip}`, 3, 3_600_000))) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde e tente novamente.' },
      { status: 429 },
    )
  }

  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ ok: true })
    }

    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ ok: true })
    }

    await resendEmailVerification(normalizeEmail(parsed.data.email))
    return NextResponse.json({ ok: true })
  } catch (e) {
    logServerError('[POST /api/auth/resend-verification]', e)
    return NextResponse.json({ ok: true })
  }
}
