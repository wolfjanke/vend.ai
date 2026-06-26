import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { sql } from '@/lib/db'
import { logServerError } from '@/lib/logger'
import { z } from 'zod'
import { checkResetPasswordRateLimit } from '@/lib/auth-rate-limit'
import { passwordSchema } from '@/lib/password-policy'
import { clientIp } from '@/lib/rate-limit'
export { dynamic } from '@/lib/route-dynamic'


const schema = z.object({
  token:    z.string().min(10),
  password: passwordSchema,
})

export async function POST(req: NextRequest) {
  const ip = clientIp(req)
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

    const rows = await sql`
      SELECT t.id, t.user_id, t.expires_at, t.used_at
      FROM password_reset_tokens t
      WHERE t.token = ${token}
      LIMIT 1
    `
    const row = rows[0] as { id: string; user_id: string; expires_at: string; used_at: string | null } | undefined
    if (!row || row.used_at) {
      return NextResponse.json({ error: 'Link inválido ou já utilizado' }, { status: 400 })
    }
    if (new Date(row.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Link expirado. Solicite um novo.' }, { status: 400 })
    }

    const hash = await bcrypt.hash(password, 10)
    await sql`
      UPDATE admin_users
      SET password_hash = ${hash}, password_changed_at = NOW()
      WHERE id = ${row.user_id}
    `
    await sql`UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = ${row.user_id} AND used_at IS NULL`

    return NextResponse.json({ ok: true })
  } catch (e) {
    logServerError('[reset-password]', e)
    return NextResponse.json({ error: 'Erro ao redefinir senha' }, { status: 500 })
  }
}
