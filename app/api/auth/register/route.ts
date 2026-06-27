import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { slugify } from '@/lib/masks'
import { registerSchema } from '@/lib/validations'
import { logServerError } from '@/lib/logger'
import {
  checkRegisterEmailRateLimit,
  checkRegisterIpRateLimit,
} from '@/lib/auth-rate-limit'
import { resolveRateLimitIp } from '@/lib/rate-limit'
import { createAndSendEmailVerification, resendEmailVerification } from '@/lib/email-verification'
import { getGlobalConfig } from '@/lib/global-config'
import { validateNewPassword } from '@/lib/validate-new-password'
import { hashPassword } from '@/lib/password-hash'
export { dynamic } from '@/lib/route-dynamic'


export async function POST(req: NextRequest) {
  const ip = resolveRateLimitIp(req)
  if (!(await checkRegisterIpRateLimit(ip))) {
    return NextResponse.json({ error: 'Muitas tentativas. Tente novamente mais tarde.' }, { status: 429 })
  }

  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const signupsEnabled = await getGlobalConfig<boolean>('new_signups_enabled')
    if (signupsEnabled === false) {
      return NextResponse.json(
        { error: 'Novos cadastros estão temporariamente desativados. Tente novamente mais tarde.' },
        { status: 403 },
      )
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
      ownerName,
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

    if (!(await checkRegisterEmailRateLimit(email))) {
      return NextResponse.json({ error: 'Muitas tentativas. Tente novamente mais tarde.' }, { status: 429 })
    }

    const pwdCheck = await validateNewPassword(password)
    if (!pwdCheck.ok) {
      return NextResponse.json({ error: pwdCheck.error }, { status: 400 })
    }

    const initialSettings = {
      genderFocus: genderFocus ?? 'feminine',
      ageGroup:    ageGroup ?? 'adult',
      ownerName:   ownerName.trim(),
    }

    const resolvedThemeName = theme_name ?? 'default'
    const resolvedShimmer = Boolean(theme_shimmer)
    const resolvedOnboarding = theme_onboarding_done ?? false

    const existing = await sql`SELECT id FROM admin_users WHERE email = ${email} LIMIT 1`
    if (existing.length > 0) {
      void resendEmailVerification(email).catch(err =>
        logServerError('[register] reenvio verificação (e-mail existente)', err),
      )
      return NextResponse.json({ needsVerification: true, email })
    }

    const passwordHash = await hashPassword(password)
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

    void createAndSendEmailVerification(newUser.id as string, email).catch(err =>
      logServerError('[register] verificação de e-mail', err),
    )

    return NextResponse.json({ needsVerification: true, email, slug: store.slug })
  } catch (error) {
    logServerError('[POST /api/auth/register]', error)
    return NextResponse.json({ error: 'Erro ao criar conta' }, { status: 500 })
  }
}
