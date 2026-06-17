import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import { productBodySchema } from '@/lib/validations'
import { logServerError } from '@/lib/logger'
import { resolveProductSlugForStore } from '@/lib/product-slug'
import { getStorePlanContext } from '@/lib/store-plan-access'
export { dynamic } from '@/lib/route-dynamic'


export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const parsed = productBodySchema.safeParse(body)
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Dados inválidos'
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const { name, description, category, audience, price, promo_price, variants_json, catalog_axes, active } = parsed.data

    const storeRows = await sql`SELECT plan, is_demo, slug FROM stores WHERE id = ${session.storeId} LIMIT 1`
    const planCtx = getStorePlanContext(storeRows[0] ?? {})
    const limit = planCtx.productLimit
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

    const productSlug = await resolveProductSlugForStore(session.storeId, name)

    const [product] = await sql`
      INSERT INTO products (store_id, name, slug, description, category, audience, price, promo_price, variants_json, catalog_axes, active)
      VALUES (
        ${session.storeId},
        ${name},
        ${productSlug},
        ${description ?? ''},
        ${category ?? 'outro'},
        ${audience ?? null},
        ${price},
        ${promo_price ?? null},
        ${JSON.stringify(variants_json ?? [])}::jsonb,
        ${catalog_axes ? JSON.stringify(catalog_axes) : null}::jsonb,
        ${active ?? true}
      )
      RETURNING id
    `
    return NextResponse.json({ id: product.id })
  } catch (error) {
    logServerError('[POST /api/produtos]', error)
    return NextResponse.json({ error: 'Erro ao criar produto' }, { status: 500 })
  }
}
