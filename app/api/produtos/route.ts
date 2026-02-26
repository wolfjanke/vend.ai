import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import type { PlanSlug } from '@/types'
import { PLAN_PRODUCT_LIMITS } from '@/types'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { name, description, category, price, promo_price, variants_json, active } = await req.json()

    if (!name || !price) {
      return NextResponse.json({ error: 'name e price são obrigatórios' }, { status: 400 })
    }

    const planRows = await sql`SELECT plan FROM stores WHERE id = ${session.storeId} LIMIT 1`
    const plan = (planRows[0]?.plan ?? 'free') as PlanSlug
    const limit = PLAN_PRODUCT_LIMITS[plan]
    if (limit != null) {
      const countRows = await sql`SELECT COUNT(*) as c FROM products WHERE store_id = ${session.storeId}`
      const count = Number(countRows[0]?.c ?? 0)
      if (count >= limit) {
        return NextResponse.json(
          { error: `Limite de ${limit} produtos do seu plano. Faça upgrade para cadastrar mais.` },
          { status: 403 }
        )
      }
    }

    const [product] = await sql`
      INSERT INTO products (store_id, name, description, category, price, promo_price, variants_json, active)
      VALUES (
        ${session.storeId},
        ${name},
        ${description ?? ''},
        ${category ?? 'outro'},
        ${price},
        ${promo_price ?? null},
        ${JSON.stringify(variants_json ?? [])}::jsonb,
        ${active ?? true}
      )
      RETURNING id
    `
    return NextResponse.json({ id: product.id })
  } catch (error) {
    console.error('[POST /api/produtos]', error)
    return NextResponse.json({ error: 'Erro ao criar produto' }, { status: 500 })
  }
}
