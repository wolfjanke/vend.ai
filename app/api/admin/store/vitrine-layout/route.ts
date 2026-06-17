import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sql } from '@/lib/db'
import { requireSession } from '@/lib/require-session'
import { logServerError } from '@/lib/logger'
import { isPaidPlan, type PlanSlug } from '@/lib/plans'
import { getTheme, type ThemeName } from '@/lib/themes'
import { normalizeLogoSize } from '@/lib/store-logo'
import {
  canUseCenteredHeader,
  canUseMobileGridColsOverride,
  normalizeBrandDisplay,
  normalizeHeaderLayout,
  normalizeLogoShape,
  normalizeMobileGridCols,
  normalizeShowSearch,
  themeSupportsMobileGridOverride,
} from '@/lib/vitrine-layout'

export { dynamic } from '@/lib/route-dynamic'

const vitrineLayoutPatchSchema = z.object({
  logoSize:       z.enum(['sm', 'md', 'lg']).optional(),
  logoShape:      z.enum(['rect', 'square', 'circle']).optional(),
  brandDisplay:   z.enum(['logo-and-name', 'logo-only', 'name-only']).optional(),
  headerLayout:   z.enum(['bar', 'centered']).optional(),
  showSearch:     z.boolean().optional(),
  mobileGridCols: z.union([z.literal(2), z.literal(3)]).optional(),
})

/** Salva opções de layout da vitrine (salva na hora, sem formulário completo). */
export async function PATCH(req: NextRequest) {
  try {
    const { session, unauthorized } = await requireSession()
    if (!session) return unauthorized!

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const parsed = vitrineLayoutPatchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const patch = parsed.data
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'Nada para salvar' }, { status: 400 })
    }

    const rows = await sql`
      SELECT settings_json, plan, theme_name, logo_url, theme_logo_url
      FROM stores WHERE id = ${session.storeId} LIMIT 1
    `
    const row = rows[0]
    if (!row) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })

    const plan = (row.plan ?? 'free') as PlanSlug
    const themeName = (row.theme_name ?? 'default') as ThemeName
    const theme = getTheme(themeName)
    const hasLogo = Boolean(
      (row.logo_url as string | null)?.trim() || (row.theme_logo_url as string | null)?.trim(),
    )
    const current = (row.settings_json as Record<string, unknown>) ?? {}

    if (patch.headerLayout === 'centered' && !canUseCenteredHeader(plan)) {
      return NextResponse.json(
        { error: 'Header centralizado disponível a partir do plano Starter.' },
        { status: 403 },
      )
    }

    if (patch.mobileGridCols === 3) {
      if (!canUseMobileGridColsOverride(plan)) {
        return NextResponse.json(
          { error: 'Grid de 3 colunas no mobile disponível a partir do plano Starter.' },
          { status: 403 },
        )
      }
      if (!themeSupportsMobileGridOverride(themeName, theme.catalogLayout)) {
        return NextResponse.json(
          { error: 'Este tema não suporta 3 colunas no mobile. Use Flash ou Discovery.' },
          { status: 400 },
        )
      }
    }

    const merged = {
      ...current,
      ...(patch.logoSize !== undefined && { logoSize: normalizeLogoSize(patch.logoSize) }),
      ...(patch.logoShape !== undefined && { logoShape: normalizeLogoShape(patch.logoShape) }),
      ...(patch.brandDisplay !== undefined && {
        brandDisplay: normalizeBrandDisplay(patch.brandDisplay, hasLogo),
      }),
      ...(patch.headerLayout !== undefined && {
        headerLayout: normalizeHeaderLayout(patch.headerLayout),
      }),
      ...(patch.showSearch !== undefined && { showSearch: normalizeShowSearch(patch.showSearch) }),
      ...(patch.mobileGridCols !== undefined && {
        mobileGridCols: normalizeMobileGridCols(patch.mobileGridCols),
      }),
    }

    await sql`
      UPDATE stores SET settings_json = ${JSON.stringify(merged)}::jsonb
      WHERE id = ${session.storeId}
    `

    return NextResponse.json({ ok: true, ...merged })
  } catch (error) {
    logServerError('[PATCH /api/admin/store/vitrine-layout]', error)
    return NextResponse.json({ error: 'Erro ao salvar layout da vitrine' }, { status: 503 })
  }
}
