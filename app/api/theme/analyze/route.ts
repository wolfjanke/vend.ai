import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/require-session'
import { checkStoreRateLimit } from '@/lib/rate-limit-helpers'
import { THEME_ANALYZE_STORE_LIMIT, THEME_ANALYZE_STORE_WINDOW_MS } from '@/lib/rate-limit-config'
import { analyzeLogoForTheme, parseThemeAnalysis } from '@/lib/theme-ai'
import { logServerError } from '@/lib/logger'
import { sql } from '@/lib/db'
import {
  canAnalyzeThemeForStore,
  getAvailableThemesForStore,
} from '@/lib/store-plan-access'
export { dynamic } from '@/lib/route-dynamic'


export async function POST(req: NextRequest) {
  try {
    const { session, unauthorized } = await requireSession()
    if (!session) return unauthorized!

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY não configurada' }, { status: 500 })
    }

    const storeRows = await sql`
      SELECT plan, slug, is_demo FROM stores WHERE id = ${session.storeId} LIMIT 1
    `
    const storeRow = storeRows[0] ?? {}
    if (!canAnalyzeThemeForStore(storeRow)) {
      return NextResponse.json({ error: 'Análise de logo disponível em planos pagos.' }, { status: 403 })
    }

    if (!(await checkStoreRateLimit(
      'theme:analyze',
      session.storeId,
      THEME_ANALYZE_STORE_LIMIT,
      THEME_ANALYZE_STORE_WINDOW_MS,
    ))) {
      return NextResponse.json({ error: 'Limite de 5 análises por hora atingido.' }, { status: 429 })
    }

    const body = await req.json() as {
      logo?:      string
      mimeType?:  string
      segment?:   string
      audience?:  string
      personality?: string
    }

    if (!body.logo?.trim()) {
      return NextResponse.json({ error: 'logo obrigatório' }, { status: 400 })
    }

    const raw = await analyzeLogoForTheme(
      body.logo,
      body.mimeType ?? 'image/png',
      {
        segment:     body.segment?.trim() || 'moda',
        audience:    body.audience?.trim() || 'adulto',
        personality: body.personality?.trim() || 'moderna',
      },
    )

    const parsed = parseThemeAnalysis(raw)
    const allowed = new Set(getAvailableThemesForStore(storeRow))
    parsed.suggestions = (parsed.suggestions ?? []).slice(0, 3).filter(s =>
      allowed.has(s.themeName),
    )

    return NextResponse.json(parsed)
  } catch (error) {
    logServerError('[POST /api/theme/analyze]', error)
    const msg = error instanceof Error ? error.message : 'Erro na análise'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
