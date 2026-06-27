import { NextRequest, NextResponse } from 'next/server'
import { getSessionSafe } from '@/lib/auth'
import { sql } from '@/lib/db'
import { slugify } from '@/lib/masks'
import { completeSignupSchema } from '@/lib/validations'
import { logServerError } from '@/lib/logger'
import { resolveRateLimitIp } from '@/lib/rate-limit'
import { checkCompleteSignupIpRateLimit } from '@/lib/auth-rate-limit'
import { getGlobalConfig } from '@/lib/global-config'
export { dynamic } from '@/lib/route-dynamic'

export async function POST(req: NextRequest) {
  const ip = resolveRateLimitIp(req)
  if (!(await checkCompleteSignupIpRateLimit(ip))) {
    return NextResponse.json({ error: 'Muitas tentativas. Tente novamente mais tarde.' }, { status: 429 })
  }

  const session = await getSessionSafe()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Faça login para continuar.' }, { status: 401 })
  }

  try {
    const userRows = await sql`
      SELECT id, email, store_id, google_id FROM admin_users WHERE id = ${session.user.id} LIMIT 1
    `
    const user = userRows[0]
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }
    if (!user.google_id) {
      return NextResponse.json({ error: 'Use o cadastro padrão para esta conta.' }, { status: 403 })
    }
    if (user.store_id) {
      return NextResponse.json({ error: 'Sua loja já está configurada.' }, { status: 409 })
    }

    const signupsEnabled = await getGlobalConfig<boolean>('new_signups_enabled')
    if (signupsEnabled === false) {
      return NextResponse.json(
        { error: 'Novos cadastros estão temporariamente desativados.' },
        { status: 403 },
      )
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const parsed = completeSignupSchema.safeParse(body)
    if (!parsed.success) {
      const first =
        process.env.NODE_ENV === 'production'
          ? 'Não foi possível criar a loja. Verifique os dados.'
          : (Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? 'Dados inválidos')
      return NextResponse.json({ error: first }, { status: 400 })
    }

    const {
      ownerName,
      storeName,
      whatsapp,
      genderFocus,
      ageGroup,
      theme_name,
      theme_primary_color,
      theme_secondary_color,
      theme_accent_color,
      theme_background,
      theme_shimmer,
      theme_logo_url,
      theme_onboarding_done,
    } = parsed.data

    const initialSettings = {
      genderFocus: genderFocus ?? 'feminine',
      ageGroup: ageGroup ?? 'adult',
      ownerName: ownerName.trim(),
    }

    const storeSlug = slugify(storeName) || `loja-${Date.now()}`
    const slugCheck = await sql`SELECT id FROM stores WHERE slug = ${storeSlug} LIMIT 1`
    const finalSlug = slugCheck.length > 0 ? `${storeSlug}-${Date.now()}` : storeSlug
    const termsVersion = process.env.TERMS_VERSION ?? 'v1.0'

    const [store] = await sql`
      INSERT INTO stores (
        user_id, slug, name, whatsapp, settings_json,
        theme_name, theme_primary_color, theme_secondary_color, theme_accent_color,
        theme_background, theme_shimmer, theme_logo_url, theme_onboarding_done,
        terms_version, terms_accepted_at, terms_accepted_ip, assistant_name
      )
      VALUES (
        ${session.user.id}, ${finalSlug}, ${storeName}, ${whatsapp}, ${JSON.stringify(initialSettings)}::jsonb,
        ${theme_name ?? 'default'},
        ${theme_primary_color ?? null},
        ${theme_secondary_color ?? null},
        ${theme_accent_color ?? null},
        ${theme_background ?? 'dark'},
        ${Boolean(theme_shimmer)},
        ${theme_logo_url ?? null},
        ${theme_onboarding_done ?? false},
        ${termsVersion},
        NOW(),
        ${ip || 'não disponível'},
        'Vi'
      )
      RETURNING id, slug
    `

    await sql`UPDATE admin_users SET store_id = ${store.id} WHERE id = ${session.user.id}`

    return NextResponse.json({ ok: true, slug: store.slug })
  } catch (error) {
    logServerError('[POST /api/auth/complete-signup]', error)
    return NextResponse.json({ error: 'Erro ao criar loja' }, { status: 500 })
  }
}
