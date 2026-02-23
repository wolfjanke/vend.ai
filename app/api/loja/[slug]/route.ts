import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const storeRows = await sql`SELECT * FROM stores WHERE slug = ${params.slug} LIMIT 1`
    const store = storeRows[0]
    if (!store) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })

    const products = await sql`
      SELECT * FROM products WHERE store_id = ${store.id} AND active = true ORDER BY created_at DESC
    `

    return NextResponse.json({ store, products })
  } catch (error) {
    console.error('[GET /api/loja/[slug]]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
