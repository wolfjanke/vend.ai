import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import { productBodySchema } from '@/lib/validations'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

  const { name, description, category, price, promo_price, variants_json, active } = parsed.data

  await sql`
    UPDATE products SET
      name = ${name},
      description = ${description ?? ''},
      category = ${category ?? 'outro'},
      price = ${price},
      promo_price = ${promo_price ?? null},
      variants_json = ${JSON.stringify(variants_json ?? [])}::jsonb,
      active = ${active ?? true}
    WHERE id = ${id} AND store_id = ${session.storeId}
  `
  return NextResponse.json({ ok: true })
}
