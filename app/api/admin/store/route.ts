import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, whatsapp } = await req.json()
  if (!name) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })

  await sql`
    UPDATE stores SET name = ${name}, whatsapp = ${whatsapp ?? ''} WHERE id = ${session.storeId}
  `
  return NextResponse.json({ ok: true })
}
