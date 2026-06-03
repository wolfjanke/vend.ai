import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { sql } from '@/lib/db'
import { slugify } from '@/lib/masks'
import { registerSchema } from '@/lib/validations'
import { logServerError } from '@/lib/logger'
import { checkRateLimit, clientIp } from '@/lib/rate-limit'
import { sendWelcomeEmail } from '@/lib/email/send-welcome'
export { dynamic } from '@/lib/route-dynamic'


export async function POST(req: NextRequest) {
  const ip = clientIp(req)
  if (!checkRateLimit(`auth:register:${ip}`, 5, 3_600_000)) {
    return NextResponse.json({ error: 'Muitas tentativas. Tente novamente mais tarde.' }, { status: 429 })
  }

  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      const first =
        process.env.NODE_ENV === 'production'
          ? 'Não foi possível criar a conta. Verifique os dados e tente novamente.'
          : (Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? 'Dados inválidos')
      return NextResponse.json({ error: first }, { status: 400 })
    }

    const {
      email,
      password,
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
      ageGroup:    ageGroup ?? 'adult',
    }

    const resolvedThemeName = theme_name ?? 'default'
    const resolvedShimmer = Boolean(theme_shimmer)
    const resolvedOnboarding = theme_onboarding_done ?? true

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

    const termsVersion = process.env.TERMS_VERSION ?? 'v1.0'
    const acceptedIp = ip || 'não disponível'

    const [store] = await sql`
      INSERT INTO stores (
        user_id, slug, name, whatsapp, settings_json,
        theme_name, theme_primary_color, theme_secondary_color, theme_accent_color,
        theme_background, theme_shimmer, theme_logo_url, theme_onboarding_done,
        terms_version, terms_accepted_at, terms_accepted_ip, assistant_name
      )
      VALUES (
        ${newUser.id}, ${finalSlug}, ${storeName}, ${whatsapp}, ${JSON.stringify(initialSettings)}::jsonb,
        ${resolvedThemeName},
        ${theme_primary_color ?? null},
        ${theme_secondary_color ?? null},
        ${theme_accent_color ?? null},
        ${theme_background ?? 'dark'},
        ${resolvedShimmer},
        ${theme_logo_url ?? null},
        ${resolvedOnboarding},
        ${termsVersion},
        NOW(),
        ${acceptedIp},
        'Vi'
      )
      RETURNING id, slug
    `

    await sql`UPDATE admin_users SET store_id = ${store.id} WHERE id = ${newUser.id}`

    const acceptedAt = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })

    void sendWelcomeEmail({
      ownerName: storeName,
      ownerEmail: email,
      storeName,
      storeSlug: store.slug,
      plan: 'free',
      assistantName: 'Vi',
      acceptedAt,
      acceptedIp,
      termsVersion,
    }).catch(err => logServerError('[Email] Falha no boas-vindas', err))

    return NextResponse.json({ slug: store.slug })
  } catch (error) {
    logServerError('[POST /api/auth/register]', error)
    return NextResponse.json({ error: 'Erro ao criar conta' }, { status: 500 })
  }
}
