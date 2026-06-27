import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { logServerError } from '@/lib/logger'
import { z } from 'zod'
import { checkResetPasswordRateLimit } from '@/lib/auth-rate-limit'
import { passwordSchema } from '@/lib/password-policy'
import { notifyPasswordChanged } from '@/lib/notify-password-changed'
import { resolveRateLimitIp } from '@/lib/rate-limit'
import { clearSessionCookies } from '@/lib/auth-session-cookie'
import { bumpSessionVersion } from '@/lib/session-version'
import { validateNewPassword } from '@/lib/validate-new-password'
import { hashPassword } from '@/lib/password-hash'
export { dynamic } from '@/lib/route-dynamic'


const schema = z.object({
  token:    z.string().min(10),
  password: passwordSchema,
})

export async function POST(req: NextRequest) {
  const ip = resolveRateLimitIp(req)
  if (!(await checkResetPasswordRateLimit(ip))) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente mais tarde.' },
      { status: 429 },
    )
  }

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' },
        { status: 400 }
      )
    }

    const { token, password } = parsed.data

    const pwdCheck = await validateNewPassword(password)
    if (!pwdCheck.ok) {
      return NextResponse.json({ error: pwdCheck.error }, { status: 400 })
    }

    const rows = await sql`
      SELECT t.id, t.user_id, t.expires_at, t.used_at, u.email
      FROM password_reset_tokens t
      JOIN admin_users u ON u.id = t.user_id
      WHERE t.token = ${token}
      LIMIT 1
    `
    const row = rows[0] as {
      id: string
      user_id: string
      expires_at: string
      used_at: string | null
      email: string
    } | undefined
    if (!row || row.used_at) {
      return NextResponse.json({ error: 'Link inválido ou já utilizado' }, { status: 400 })
    }
    if (new Date(row.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Link expirado. Solicite um novo.' }, { status: 400 })
    }

    const hash = await hashPassword(password)
    await sql`
      UPDATE admin_users
      SET password_hash = ${hash}, password_changed_at = NOW()
      WHERE id = ${row.user_id}
    `
    await sql`UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = ${row.user_id} AND used_at IS NULL`
    await bumpSessionVersion(row.user_id)

    notifyPasswordChanged(row.email)

    const res = NextResponse.json({ ok: true })
    clearSessionCookies(res)
    return res
  } catch (e) {
    logServerError('[reset-password]', e)
    return NextResponse.json({ error: 'Erro ao redefinir senha' }, { status: 500 })
  }
}
