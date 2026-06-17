import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sql } from '@/lib/db'
import { requireSession } from '@/lib/require-session'
import { logServerError } from '@/lib/logger'
import {
  canSelectThemeForStore,
  canUseShimmerForStore,
} from '@/lib/store-plan-access'
import {
  defaultShimmerForTheme,
  getTheme,
  type ThemeBackground,
} from '@/lib/themes'
import { deriveThemeColors } from '@/lib/theme-derive'
import { getThemeContrastWarnings, isValidHex, validateThemeColors } from '@/lib/theme-contrast'

export { dynamic } from '@/lib/route-dynamic'
const themeNameSchema = z.enum([
  'default', 'boutique', 'street', 'editorial', 'pop', 'fitness', 'lumiere',
  'flash', 'casual', 'social',
])

const themePutSchema = z.object({
  theme_name:            themeNameSchema,
  theme_primary_color:   z.string().nullable().optional(),
  theme_secondary_color: z.string().nullable().optional(),
  theme_accent_color:    z.string().nullable().optional(),
  theme_background:      z.enum(['light', 'dark']).optional(),
  theme_shimmer:         z.boolean().optional(),
  theme_logo_url:        z.string().nullable().optional(),
  theme_onboarding_done: z.boolean().optional(),
})

export async function PUT(req: NextRequest) {
  try {
    const { session, unauthorized } = await requireSession()
    if (!session) return unauthorized!

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const parsed = themePutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const storeRows = await sql`
      SELECT plan, slug, is_demo FROM stores WHERE id = ${session.storeId} LIMIT 1
    `
    const storeRow = storeRows[0] ?? {}
    const data = parsed.data

    if (!canSelectThemeForStore(storeRow, data.theme_name)) {
      return NextResponse.json(
        { error: 'Tema não disponível no seu plano.' },
        { status: 403 },
      )
    }

    const theme = getTheme(data.theme_name)
    const background = (data.theme_background ?? theme.defaultBackground) as ThemeBackground

    if (background === 'light' && !theme.allowLightBackground) {
      return NextResponse.json({ error: 'Este tema não suporta fundo claro.' }, { status: 400 })
    }
    if (background === 'dark' && !theme.allowDarkBackground) {
      return NextResponse.json({ error: 'Este tema não suporta fundo escuro.' }, { status: 400 })
    }

    const bgHex =
      background === 'dark'
        ? theme.defaultColors.background
        : theme.defaultColors.backgroundLight

    const colors = {
      primary: data.theme_primary_color ?? undefined,
      accent:  data.theme_accent_color ?? undefined,
    }

    for (const [key, value] of Object.entries(colors)) {
      if (value != null && value !== '' && !isValidHex(value)) {
        return NextResponse.json({ error: `Cor ${key} inválida` }, { status: 400 })
      }
    }

    const formatCheck = validateThemeColors(colors, background, bgHex)
    if (!formatCheck.ok) {
      return NextResponse.json({ error: formatCheck.message }, { status: 400 })
    }

    const contrastWarnings = getThemeContrastWarnings(colors, background, bgHex)

    const derivedSecondary =
      colors.primary && colors.accent
        ? deriveThemeColors(colors.primary, colors.accent, background, bgHex).secondary
        : null

    let shimmer = data.theme_shimmer
    if (shimmer === undefined) {
      shimmer = defaultShimmerForTheme(data.theme_name)
    }
    if (shimmer && !canUseShimmerForStore(storeRow)) {
      return NextResponse.json(
        { error: 'Efeito shimmer disponível a partir do plano Pro.' },
        { status: 403 },
      )
    }

    const updateLogo =
      typeof body === 'object' && body !== null && 'theme_logo_url' in body

    if (updateLogo) {
      const logoUrl =
        data.theme_logo_url === '' || data.theme_logo_url == null
          ? null
          : data.theme_logo_url

      await sql`
        UPDATE stores SET
          theme_name = ${data.theme_name},
          theme_primary_color = ${data.theme_primary_color ?? null},
          theme_secondary_color = ${derivedSecondary},
          theme_accent_color = ${data.theme_accent_color ?? null},
          theme_background = ${background},
          theme_shimmer = ${Boolean(shimmer)},
          theme_logo_url = ${logoUrl},
          theme_onboarding_done = COALESCE(${data.theme_onboarding_done ?? null}, theme_onboarding_done)
        WHERE id = ${session.storeId}
      `
    } else {
      await sql`
        UPDATE stores SET
          theme_name = ${data.theme_name},
          theme_primary_color = ${data.theme_primary_color ?? null},
          theme_secondary_color = ${derivedSecondary},
          theme_accent_color = ${data.theme_accent_color ?? null},
          theme_background = ${background},
          theme_shimmer = ${Boolean(shimmer)},
          theme_onboarding_done = COALESCE(${data.theme_onboarding_done ?? null}, theme_onboarding_done)
        WHERE id = ${session.storeId}
      `
    }

    return NextResponse.json({
      ok: true,
      ...(contrastWarnings.length > 0 ? { contrastWarnings } : {}),
    })
  } catch (error) {
    logServerError('[PUT /api/admin/theme]', error)
    return NextResponse.json({ error: 'Erro ao salvar tema' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { session, unauthorized } = await requireSession()
    if (!session) return unauthorized!

    const rows = await sql`
      SELECT
        slug, plan,
        theme_name, theme_primary_color, theme_secondary_color, theme_accent_color,
        theme_background, theme_shimmer, theme_logo_url, theme_onboarding_done, logo_url
      FROM stores
      WHERE id = ${session.storeId}
      LIMIT 1
    `
    const row = rows[0]
    if (!row) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })

    return NextResponse.json(row)
  } catch (error) {
    logServerError('[GET /api/admin/theme]', error)
    return NextResponse.json({ error: 'Erro ao carregar tema' }, { status: 500 })
  }
}
