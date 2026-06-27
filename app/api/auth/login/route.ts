import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authenticateAdminUser, isAdminEmailVerified } from '@/lib/authenticate-admin'
import { checkLoginRateLimit } from '@/lib/auth-rate-limit'
import {
  createSessionToken,
  sessionCookieName,
  sessionCookieOptions,
} from '@/lib/auth-session-cookie'
import { normalizeEmail } from '@/lib/email-normalize'
import { resolveRateLimitIp } from '@/lib/rate-limit'
import { logLoginRateLimitBlocked } from '@/lib/auth-login-log'
import { logServerError } from '@/lib/logger'
import { createAndSendEmailVerification } from '@/lib/email-verification'
import { recordAdminLogin } from '@/lib/login-alert'
export { dynamic } from '@/lib/route-dynamic'

const LOGIN_FAILED_MSG = 'E-mail ou senha inválidos.'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const ip = resolveRateLimitIp(req)

  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: LOGIN_FAILED_MSG }, { status: 401 })
    }

    const email = normalizeEmail(parsed.data.email)
    const { password } = parsed.data

    if (!(await checkLoginRateLimit(ip, email))) {
      logLoginRateLimitBlocked(ip, email)
      return NextResponse.json(
        { error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' },
        { status: 429 },
      )
    }

    const user = await authenticateAdminUser(email, password)
    if (!user) {
      return NextResponse.json({ error: LOGIN_FAILED_MSG }, { status: 401 })
    }

    if (!(await isAdminEmailVerified(user.id))) {
      void createAndSendEmailVerification(user.id, email).catch(err =>
        logServerError('[login] reenvio verificação', err),
      )
      return NextResponse.json({ error: LOGIN_FAILED_MSG }, { status: 401 })
    }

    const token = await createSessionToken(user)
    void recordAdminLogin(user.id, email, ip)
    const res = NextResponse.json({ ok: true })
    res.cookies.set(sessionCookieName(), token, sessionCookieOptions())
    return res
  } catch (e) {
    logServerError('[POST /api/auth/login]', e)
    return NextResponse.json({ error: 'Erro ao entrar. Tente novamente.' }, { status: 500 })
  }
}
