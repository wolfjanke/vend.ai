import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { passwordSchema } from '@/lib/password-policy'
import { sql } from '@/lib/db'
import { getSessionSafe } from '@/lib/auth'
import { logServerError } from '@/lib/logger'
export { dynamic } from '@/lib/route-dynamic'

const schema = z.object({
  password: passwordSchema.optional(),
  confirmDelete: z.literal(true).optional(),
})

export async function POST(req: NextRequest) {
  const session = await getSessionSafe()
  if (!session?.storeId || !session.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  if (session.impersonating) {
    return NextResponse.json({ error: 'Encerre a impersonação antes de excluir a conta.' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Confirmação inválida' }, { status: 400 })
    }

    const userRows = await sql`
      SELECT id, password_hash FROM admin_users WHERE id = ${session.user.id} LIMIT 1
    `
    const user = userRows[0]
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const passwordHash = user.password_hash as string | null
    if (passwordHash) {
      if (!parsed.data.password) {
        return NextResponse.json({ error: 'Confirme sua senha.' }, { status: 400 })
      }
      const valid = await bcrypt.compare(parsed.data.password, passwordHash)
      if (!valid) {
        return NextResponse.json({ error: 'Senha incorreta' }, { status: 403 })
      }
    } else if (parsed.data.confirmDelete !== true) {
      return NextResponse.json({ error: 'Confirme a exclusão da conta.' }, { status: 400 })
    }

    await sql`DELETE FROM stores WHERE id = ${session.storeId}`
    await sql`DELETE FROM admin_users WHERE id = ${session.user.id}`

    return NextResponse.json({ ok: true })
  } catch (error) {
    logServerError('[admin/privacidade/excluir-conta]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
