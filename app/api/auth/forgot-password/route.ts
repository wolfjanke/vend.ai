import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { sql } from '@/lib/db'
import { sendPasswordResetEmail } from '@/lib/email'
import { normalizeEmail } from '@/lib/email-normalize'
import { logServerError } from '@/lib/logger'
import { z } from 'zod'
import {
  checkForgotPasswordEmailRateLimit,
  checkForgotPasswordIpRateLimit,
} from '@/lib/auth-rate-limit'
import { resolveRateLimitIp } from '@/lib/rate-limit'
import { buildPasswordResetPageUrl } from '@/lib/reset-password-url'
export { dynamic } from '@/lib/route-dynamic'


const schema = z.object({ email: z.string().email() })

export async function POST(req: NextRequest) {
  const ip = resolveRateLimitIp(req)
  if (!(await checkForgotPasswordIpRateLimit(ip))) {
    return NextResponse.json({ ok: true })
  }

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ ok: true })
    }
    const email = normalizeEmail(parsed.data.email)

    if (!(await checkForgotPasswordEmailRateLimit(email))) {
      return NextResponse.json({ ok: true })
    }

    const rows = await sql`SELECT id FROM admin_users WHERE email = ${email} LIMIT 1`
    const user = rows[0] as { id: string } | undefined

    if (user) {
      const token = crypto.randomBytes(32).toString('hex')
      const expires = new Date(Date.now() + 60 * 60 * 1000)

      await sql`DELETE FROM password_reset_tokens WHERE user_id = ${user.id}`
      await sql`
        INSERT INTO password_reset_tokens (user_id, token, expires_at)
        VALUES (${user.id}, ${token}, ${expires.toISOString()})
      `

      const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
      const resetUrl = buildPasswordResetPageUrl(base, token)
      const sent = await sendPasswordResetEmail(email, resetUrl)
      if (!sent.success) {
        logServerError('[forgot-password] falha ao enviar e-mail', sent.error)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    logServerError('[forgot-password]', e)
    return NextResponse.json({ ok: true })
  }
}
