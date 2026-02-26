import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, whatsapp, logo_url, freteInfo, pagamentoInfo, bannerMessages } = body
  if (!name) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })

  const storeRows = await sql`SELECT settings_json FROM stores WHERE id = ${session.storeId} LIMIT 1`
  const current = (storeRows[0]?.settings_json as Record<string, unknown>) ?? {}
  const merged = {
    ...current,
    ...(freteInfo !== undefined && { freteInfo: freteInfo ?? '' }),
    ...(pagamentoInfo !== undefined && { pagamentoInfo: pagamentoInfo ?? '' }),
    ...(bannerMessages !== undefined && { bannerMessages: Array.isArray(bannerMessages) ? bannerMessages : (current.bannerMessages ?? []) }),
  }

  await sql`
    UPDATE stores SET
      name = ${name},
      whatsapp = ${whatsapp ?? ''},
      logo_url = ${logo_url ?? null},
      settings_json = ${JSON.stringify(merged)}::jsonb
    WHERE id = ${session.storeId}
  `
  return NextResponse.json({ ok: true })
}
