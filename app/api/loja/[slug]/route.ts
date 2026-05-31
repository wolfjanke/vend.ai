import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { logServerError } from '@/lib/logger'
import { toPublicStore } from '@/lib/public-store'

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const storeRows = await sql`
      SELECT
        id, slug, name, logo_url, whatsapp, settings_json, created_at,
        cep, logradouro, numero, complemento, bairro, cidade, uf
      FROM stores
      WHERE slug = ${params.slug}
      LIMIT 1
    `
    const store = storeRows[0]
    if (!store) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })

    const products = await sql`
      SELECT id, store_id, name, description, category, price, promo_price, variants_json, active, created_at
      FROM products
      WHERE store_id = ${store.id} AND active = true
      ORDER BY created_at DESC
    `

    return NextResponse.json({ store: toPublicStore(store as Record<string, unknown>), products })
  } catch (error) {
    logServerError('[GET /api/loja/[slug]]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
