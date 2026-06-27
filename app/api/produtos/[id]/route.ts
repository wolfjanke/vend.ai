import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/require-session'
import { sql } from '@/lib/db'
import { productBodySchema } from '@/lib/validations'
import { resolveProductSlugForStore } from '@/lib/product-slug'
export { dynamic } from '@/lib/route-dynamic'


export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, unauthorized } = await requireSession()
  if (!session) return unauthorized!

  const { id } = await params
  const rows = await sql`
    SELECT * FROM products WHERE id = ${id} AND store_id = ${session.storeId} LIMIT 1
  `
  const product = rows[0]
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(product)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, unauthorized } = await requireSession()
  if (!session) return unauthorized!

  const { id } = await params
  const rows = await sql`
    SELECT id FROM products WHERE id = ${id} AND store_id = ${session.storeId} LIMIT 1
  `
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = productBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' },
      { status: 400 }
    )
  }

  const { name, description, category, audience, brand, price, promo_price, variants_json, catalog_axes, active } = parsed.data
  const productSlug = await resolveProductSlugForStore(session.storeId, name, id)

  await sql`
    UPDATE products SET
      name = ${name},
      slug = ${productSlug},
      brand = ${brand ?? null},
      description = ${description ?? ''},
      category = ${category ?? 'outro'},
      audience = ${audience ?? null},
      price = ${price},
      promo_price = ${promo_price ?? null},
      variants_json = ${JSON.stringify(variants_json ?? [])}::jsonb,
      catalog_axes = ${catalog_axes ? JSON.stringify(catalog_axes) : null}::jsonb,
      active = ${active ?? true}
    WHERE id = ${id} AND store_id = ${session.storeId}
  `
  return NextResponse.json({ ok: true })
}
