import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyEmailByToken } from '@/lib/email-verification'
import {
  createSessionToken,
  sessionCookieName,
  sessionCookieOptions,
} from '@/lib/auth-session-cookie'
import { sendWelcomeEmail } from '@/lib/email/send-welcome'
import { logServerError } from '@/lib/logger'
export { dynamic } from '@/lib/route-dynamic'

const schema = z.object({
  token: z.string().min(10),
})

export async function POST(req: NextRequest) {
  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Link inválido' }, { status: 400 })
    }

    const verified = await verifyEmailByToken(parsed.data.token)
    if (!verified) {
      return NextResponse.json({ error: 'Link inválido ou expirado' }, { status: 400 })
    }

    const acceptedAt = new Date(verified.termsAcceptedAt).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
    })

    void sendWelcomeEmail({
      ownerName: verified.ownerName,
      ownerEmail: verified.email,
      storeName: verified.storeName,
      storeSlug: verified.storeSlug,
      plan: 'free',
      assistantName: 'Vi',
      acceptedAt,
      acceptedIp: verified.termsAcceptedIp,
      termsVersion: verified.termsVersion,
    }).catch(err => logServerError('[verify-email] boas-vindas', err))

    const token = await createSessionToken({
      id: verified.userId,
      email: verified.email,
      storeId: verified.storeId,
    })

    const res = NextResponse.json({ ok: true, slug: verified.storeSlug })
    res.cookies.set(sessionCookieName(), token, sessionCookieOptions())
    return res
  } catch (e) {
    logServerError('[POST /api/auth/verify-email]', e)
    return NextResponse.json({ error: 'Erro ao verificar e-mail' }, { status: 500 })
  }
}
