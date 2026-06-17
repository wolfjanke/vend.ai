import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { requireSuperadmin } from '@/lib/superadmin'
import { logServerError } from '@/lib/logger'
export { dynamic } from '@/lib/route-dynamic'

type Ctx = { params: { storeId: string } | Promise<{ storeId: string }> }

export async function POST(_req: Request, { params }: Ctx) {
  const { error } = await requireSuperadmin()
  if (error) return error

  const { storeId } = await params

  try {
    const rows = await sql`
      SELECT retention_bonus_granted_at, retention_offer_clicked_at
      FROM stores WHERE id = ${storeId} LIMIT 1
    `
    const store = rows[0] as {
      retention_bonus_granted_at: string | null
      retention_offer_clicked_at: string | null
    } | undefined

    if (!store) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })
    }
    if (!store.retention_offer_clicked_at) {
      return NextResponse.json({ error: 'Sem registro de clique na oferta' }, { status: 409 })
    }
    if (store.retention_bonus_granted_at) {
      return NextResponse.json({ error: 'Bônus já concedido' }, { status: 409 })
    }

    await sql`
      UPDATE stores SET retention_bonus_dismissed_at = NOW()
      WHERE id = ${storeId}
        AND retention_bonus_granted_at IS NULL
    `

    return NextResponse.json({ ok: true })
  } catch (err) {
    logServerError('[POST /api/superadmin/retencao/dismiss]', err)
    return NextResponse.json({ error: 'Falha ao dispensar' }, { status: 500 })
  }
}
