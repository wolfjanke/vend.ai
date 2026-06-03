import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { requireSuperadmin } from '@/lib/superadmin'
export { dynamic } from '@/lib/route-dynamic'


type Ctx = { params: { id: string } }

export async function POST(_req: Request, { params }: Ctx) {
  const { error } = await requireSuperadmin()
  if (error) return error

  try {
    const rows = await sql`SELECT id, name, slug FROM stores WHERE id = ${params.id} LIMIT 1`
    if (!rows[0]) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })
    }
    return NextResponse.json({
      ok: true,
      storeId: params.id,
      name: rows[0].name,
      slug: rows[0].slug,
    })
  } catch (e) {
    console.error('[superadmin/impersonate]', e)
    return NextResponse.json({ error: 'Falha' }, { status: 500 })
  }
}
