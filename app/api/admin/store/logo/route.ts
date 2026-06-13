import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sql } from '@/lib/db'
import { requireSession } from '@/lib/require-session'
import { logServerError } from '@/lib/logger'
import { normalizeLogoSize, type LogoSize } from '@/lib/store-logo'

export { dynamic } from '@/lib/route-dynamic'

const logoPatchSchema = z.object({
  logo_url: z.string().nullable().optional(),
  logoSize: z.enum(['sm', 'md', 'lg']).optional(),
})

/** Salva logo e/ou tamanho sem exigir o formulário completo. */
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

    const parsed = logoPatchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const { logo_url, logoSize } = parsed.data
    if (logo_url === undefined && logoSize === undefined) {
      return NextResponse.json({ error: 'Nada para salvar' }, { status: 400 })
    }

    const rows = await sql`
      SELECT settings_json, logo_url FROM stores WHERE id = ${session.storeId} LIMIT 1
    `
    const row = rows[0]
    if (!row) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })

    const current = (row.settings_json as Record<string, unknown>) ?? {}
    const merged = {
      ...current,
      ...(logoSize !== undefined && { logoSize: normalizeLogoSize(logoSize) }),
    }

    if (logo_url !== undefined) {
      const logo = logo_url === '' || logo_url == null ? null : logo_url.trim()
      await sql`
        UPDATE stores SET
          logo_url = ${logo},
          theme_logo_url = ${logo},
          settings_json = ${JSON.stringify(merged)}::jsonb
        WHERE id = ${session.storeId}
      `
    } else {
      await sql`
        UPDATE stores SET
          settings_json = ${JSON.stringify(merged)}::jsonb
        WHERE id = ${session.storeId}
      `
    }

    return NextResponse.json({
      ok: true,
      logo_url: logo_url !== undefined
        ? (logo_url === '' || logo_url == null ? null : logo_url.trim())
        : (row.logo_url as string | null),
      logoSize: (merged.logoSize as LogoSize) ?? normalizeLogoSize(current.logoSize),
    })
  } catch (error) {
    logServerError('[PATCH /api/admin/store/logo]', error)
    return NextResponse.json({ error: 'Erro ao salvar logo' }, { status: 503 })
  }
}
