import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { resendEmailVerification } from '@/lib/email-verification'
import { normalizeEmail } from '@/lib/email-normalize'
import { logServerError } from '@/lib/logger'
import {
  checkResendVerificationEmailRateLimit,
  checkResendVerificationIpRateLimit,
} from '@/lib/auth-rate-limit'
import { resolveRateLimitIp } from '@/lib/rate-limit'
export { dynamic } from '@/lib/route-dynamic'

const schema = z.object({ email: z.string().email() })

const RATE_LIMIT_MSG = 'Muitas tentativas. Aguarde e tente novamente.'

export async function POST(req: NextRequest) {
  const ip = resolveRateLimitIp(req)
  if (!(await checkResendVerificationIpRateLimit(ip))) {
    return NextResponse.json({ error: RATE_LIMIT_MSG }, { status: 429 })
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

    const email = normalizeEmail(parsed.data.email)

    if (!(await checkResendVerificationEmailRateLimit(email))) {
      return NextResponse.json({ error: RATE_LIMIT_MSG }, { status: 429 })
    }

    await resendEmailVerification(email)
    return NextResponse.json({ ok: true })
  } catch (e) {
    logServerError('[POST /api/auth/resend-verification]', e)
    return NextResponse.json({ ok: true })
  }
}
