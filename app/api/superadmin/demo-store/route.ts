import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { requireSuperadmin } from '@/lib/superadmin'
import { DEMO_STORE_SLUG, DEMO_STORE_NAME } from '@/lib/demo-store'
export { dynamic } from '@/lib/route-dynamic'

export async function GET() {
  const { error } = await requireSuperadmin()
  if (error) return error

  try {
    const rows = await sql`
      SELECT id, name, slug, is_demo
      FROM stores
      WHERE slug = ${DEMO_STORE_SLUG}
      LIMIT 1
    `
    const store = rows[0]
    if (!store) {
      return NextResponse.json(
        { error: `Loja demo "${DEMO_STORE_SLUG}" não encontrada no banco.` },
        { status: 404 },
      )
    }

    return NextResponse.json({
      id: store.id as string,
      name: (store.name as string) || DEMO_STORE_NAME,
      slug: store.slug as string,
      is_demo: Boolean(store.is_demo),
      vitrineUrl: `/${DEMO_STORE_SLUG}`,
    })
  } catch (e) {
    console.error('[superadmin/demo-store]', e)
    return NextResponse.json({ error: 'Falha ao carregar loja demo' }, { status: 500 })
  }
}
