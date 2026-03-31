import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { sql } from '@/lib/db'
import { slugify } from '@/lib/masks'
import { registerSchema } from '@/lib/validations'

export async function POST(req: NextRequest) {
  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      const err = parsed.error.flatten().fieldErrors
      const first = Object.values(err).flat()[0] ?? 'Dados inválidos'
      return NextResponse.json({ error: first }, { status: 400 })
    }

    const { email, password, storeName, whatsapp } = parsed.data

    const existing = await sql`SELECT id FROM admin_users WHERE email = ${email} LIMIT 1`
    if (existing.length > 0) {
      return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const storeSlug    = slugify(storeName) || `loja-${Date.now()}`

    const slugCheck = await sql`SELECT id FROM stores WHERE slug = ${storeSlug} LIMIT 1`
    const finalSlug = slugCheck.length > 0 ? `${storeSlug}-${Date.now()}` : storeSlug

    const [newUser] = await sql`
      INSERT INTO admin_users (email, password_hash)
      VALUES (${email}, ${passwordHash})
      RETURNING id
    `

    const [store] = await sql`
      INSERT INTO stores (user_id, slug, name, whatsapp)
      VALUES (${newUser.id}, ${finalSlug}, ${storeName}, ${whatsapp})
      RETURNING id, slug
    `

    await sql`UPDATE admin_users SET store_id = ${store.id} WHERE id = ${newUser.id}`

    return NextResponse.json({ slug: store.slug })
  } catch (error) {
    console.error('[POST /api/auth/register]', error)
    return NextResponse.json({ error: 'Erro ao criar conta' }, { status: 500 })
  }
}
