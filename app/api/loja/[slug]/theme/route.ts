import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isReservedStoreSlug } from '@/lib/reserved-slugs'
import { resolveStoreTheme } from '@/lib/theme-css'
export { dynamic } from '@/lib/route-dynamic'

interface Props {
  params: { slug: string }
}

export async function GET(_req: Request, { params }: Props) {
  if (isReservedStoreSlug(params.slug)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const rows = await sql`
      SELECT
        theme_name, theme_primary_color, theme_secondary_color, theme_accent_color,
        theme_background, theme_shimmer, theme_logo_url, logo_url
      FROM stores
      WHERE slug = ${params.slug}
      LIMIT 1
    `
    if (!rows[0]) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })
    }

    const resolved = resolveStoreTheme(rows[0] as Record<string, unknown>)

    return NextResponse.json(
      {
        themeName:   resolved.themeName,
        background:  resolved.background,
        shimmer:     resolved.shimmer,
        css:         resolved.css,
        fontUrl:     resolved.fontUrl,
        cardTheme:   resolved.cardTheme,
        displayLogo: resolved.displayLogo,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=60',
        },
      },
    )
  } catch {
    return NextResponse.json({ error: 'Erro ao carregar tema' }, { status: 500 })
  }
}
