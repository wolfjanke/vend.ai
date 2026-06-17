import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSessionSafe } from '@/lib/auth'
import { logServerError } from '@/lib/logger'
import { COMPANY } from '@/lib/company'
export { dynamic } from '@/lib/route-dynamic'


export async function GET() {
  const session = await getSessionSafe()
  if (!session?.storeId || !session.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const storeRows = await sql`
      SELECT s.*, u.email AS owner_email
      FROM stores s
      JOIN admin_users u ON u.id = s.user_id
      WHERE s.id = ${session.storeId}
      LIMIT 1
    `
    const store = storeRows[0]
    if (!store) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })
    }

    const products = await sql`
      SELECT id, name, slug, description, category, audience, price, promo_price,
             variants_json, catalog_axes, active, created_at
      FROM products
      WHERE store_id = ${session.storeId}
      ORDER BY created_at DESC
    `

    const orders = await sql`
      SELECT id, order_number, customer_name, customer_whatsapp, items_json, total, notes,
             status, delivery_address, payment_method, created_at, privacy_consent_at
      FROM orders
      WHERE store_id = ${session.storeId}
      ORDER BY created_at DESC
    `

    const payload = {
      exportedAt: new Date().toISOString(),
      operator:   { product: 'vendai.club', company: COMPANY.name, cnpj: COMPANY.cnpj },
      store: {
        id:                    store.id,
        slug:                  store.slug,
        name:                  store.name,
        tagline:               store.tagline,
        whatsapp:              store.whatsapp,
        logo_url:              store.logo_url,
        plan:                  store.plan,
        settings_json:         store.settings_json,
        cep:                   store.cep,
        logradouro:            store.logradouro,
        numero:                store.numero,
        complemento:           store.complemento,
        bairro:                store.bairro,
        cidade:                store.cidade,
        uf:                    store.uf,
        terms_version:         store.terms_version,
        terms_accepted_at:     store.terms_accepted_at,
        created_at:            store.created_at,
        owner_email:           store.owner_email,
      },
      products,
      orders,
    }

    const json = JSON.stringify(payload, null, 2)
    return new NextResponse(json, {
      status: 200,
      headers: {
        'Content-Type':        'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="vendai-dados-${store.slug as string}.json"`,
      },
    })
  } catch (error) {
    logServerError('[admin/privacidade/export]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
