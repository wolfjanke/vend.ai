import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { passwordSchema } from '@/lib/password-policy'
import { notifyPasswordChanged } from '@/lib/notify-password-changed'
import { checkChangePasswordRateLimit } from '@/lib/auth-rate-limit'
import { clearSessionCookies } from '@/lib/auth-session-cookie'
import { requireVerifiedUser } from '@/lib/require-session'
import { bumpSessionVersion } from '@/lib/session-version'
import { validateNewPassword } from '@/lib/validate-new-password'
import { hashPassword, verifyPassword } from '@/lib/password-hash'
import { z } from 'zod'
export { dynamic } from '@/lib/route-dynamic'

const schema = z.object({
  currentPassword: z.string().optional(),
  newPassword:     passwordSchema,
})

export async function POST(req: NextRequest) {
  const { session, unauthorized } = await requireVerifiedUser()
  if (!session) return unauthorized!

  if (!(await checkChangePasswordRateLimit(session.user.id))) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' },
      { status: 429 },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' },
      { status: 400 },
    )
  }

  const { currentPassword, newPassword } = parsed.data

  const pwdCheck = await validateNewPassword(newPassword)
  if (!pwdCheck.ok) {
    return NextResponse.json({ error: pwdCheck.error }, { status: 400 })
  }

  const rows = await sql`
    SELECT password_hash FROM admin_users WHERE id = ${session.user.id} LIMIT 1
  `
  const user = rows[0] as { password_hash: string | null } | undefined
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const existingHash = user.password_hash
  if (existingHash) {
    if (!currentPassword?.trim()) {
      return NextResponse.json({ error: 'Informe a senha atual.' }, { status: 400 })
    }
    const ok = await verifyPassword(currentPassword, existingHash)
    if (!ok) return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 })
  }

  const hash = await hashPassword(newPassword)
  await sql`
    UPDATE admin_users
    SET password_hash = ${hash}, password_changed_at = NOW()
    WHERE id = ${session.user.id}
  `
  await bumpSessionVersion(session.user.id)

  if (session.user.email) {
    notifyPasswordChanged(session.user.email)
  }

  const res = NextResponse.json({ ok: true, hadPassword: Boolean(existingHash), reauthRequired: true })
  clearSessionCookies(res)
  return res
}
