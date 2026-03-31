import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(6),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
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
      { status: 400 }
    )
  }

  const { currentPassword, newPassword } = parsed.data

  const rows = await sql`
    SELECT password_hash FROM admin_users WHERE id = ${session.user.id} LIMIT 1
  `
  const user = rows[0] as { password_hash: string } | undefined
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const ok = await bcrypt.compare(currentPassword, user.password_hash)
  if (!ok) return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 })

  const hash = await bcrypt.hash(newPassword, 10)
  await sql`UPDATE admin_users SET password_hash = ${hash} WHERE id = ${session.user.id}`

  return NextResponse.json({ ok: true })
}
