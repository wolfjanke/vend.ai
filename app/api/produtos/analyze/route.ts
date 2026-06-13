import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import { analyzeProductPhoto, buildProductAnalysisPrompt, GEMINI_MODELS } from '@/lib/gemini'
import { parseProductAnalysisRaw, type ProductAnalysisItem } from '@/lib/product-analysis'
import { mapAnalysisToVariantDraft } from '@/lib/product-analysis-map'
import { inferCatalogMode, type CatalogMode } from '@/lib/product-catalog'
import type { StoreSettings, ProductAnalysisHints } from '@/types'
import { getStoreProfile, normalizeProductCategory } from '@/types'
import { logServerError } from '@/lib/logger'
import type { PlanSlug } from '@/lib/plans'
import { checkPhotoAnalysisLimit, incrementPhotoAnalysis } from '@/lib/photo-analysis-limits'
export { dynamic } from '@/lib/route-dynamic'


function normalizeItem(
  item: ProductAnalysisItem,
  customSlugs: string[],
): ProductAnalysisItem {
  return {
    ...item,
    categoria: normalizeProductCategory(String(item.categoria ?? 'outro'), customSlugs),
  }
}

function enrichAnalysisItem(
  item: ProductAnalysisItem,
  customSlugs: string[],
  catalogMode: CatalogMode,
  hints?: ProductAnalysisHints | null,
  imageCount = 1,
) {
  const normalized = normalizeItem(item, customSlugs)
  const mapped = mapAnalysisToVariantDraft(normalized, catalogMode, hints, imageCount)
  return {
    ...normalized,
    catalogAxes: mapped.catalogAxes,
    aiMeta:      mapped.aiMeta,
    variantDrafts: mapped.variants,
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY não configurada no servidor' }, { status: 500 })
    }

    const storeRows = await sql`SELECT plan, settings_json FROM stores WHERE id = ${session.storeId} LIMIT 1`
    const plan = (storeRows[0]?.plan ?? 'free') as PlanSlug
    const settingsJson = storeRows[0]?.settings_json as StoreSettings | null

    const photoLimit = await checkPhotoAnalysisLimit(session.storeId, plan)
    if (!photoLimit.allowed) {
      return NextResponse.json(
        {
          error: photoLimit.limit != null
            ? `Limite de análises por IA atingido este mês (${photoLimit.limit}). Faça upgrade para continuar.`
            : 'Análise indisponível.',
        },
        { status: 403 },
      )
    }

    const profile = getStoreProfile(settingsJson)
    const customCats = settingsJson?.customCategories ?? []
    const customSlugs = customCats.map(c => c.value).filter(Boolean)
    const body = await req.json() as { images?: string[]; hints?: ProductAnalysisHints }
    const { images, hints } = body

    if (!images?.length) {
      return NextResponse.json({ error: 'images required' }, { status: 400 })
    }

    if (images.length > 10) {
      return NextResponse.json({ error: 'Máximo de 10 imagens por análise' }, { status: 400 })
    }

    const mode = hints?.mode ?? 'single'
    const catalogMode = inferCatalogMode(hints, customCats)
    const productPrompt = buildProductAnalysisPrompt(profile, customCats, hints, images.length)

    const raw = await analyzeProductPhoto(images, productPrompt)
    const parsed = parseProductAnalysisRaw(raw, hints?.audience ?? null)

    await incrementPhotoAnalysis(session.storeId)

    if (parsed.mode === 'batch') {
      const produtos = parsed.products.map((p, i) =>
        enrichAnalysisItem(p, customSlugs, catalogMode, hints, 1),
      )
      return NextResponse.json({ batch: true, produtos })
    }

    const product = enrichAnalysisItem(parsed.product, customSlugs, catalogMode, hints, images.length)
    return NextResponse.json(product)
  } catch (error) {
    logServerError('[/api/produtos/analyze]', error)
    const msg = error instanceof Error ? error.message : 'Erro na análise'
    if (msg.includes('API_KEY_INVALID') || msg.toLowerCase().includes('api key expired')) {
      return NextResponse.json(
        { error: 'A chave da IA expirou. Atualize GEMINI_API_KEY no .env.local e reinicie o servidor.' },
        { status: 500 },
      )
    }
    if (msg.includes('404') && (msg.includes('not found') || msg.includes('is not found'))) {
      return NextResponse.json(
        {
          error:
            `O modelo de análise (${GEMINI_MODELS.photoAnalysis}) não está disponível. Verifique GEMINI_API_KEY e permissões do projeto Google AI.`,
        },
        { status: 500 },
      )
    }
    if (msg.includes('JSON') || msg.includes('JSON válido')) {
      return NextResponse.json(
        { error: 'A IA retornou um formato inválido. Tente de novo ou ajuste o modo (um produto vs vários).' },
        { status: 502 },
      )
    }
    return NextResponse.json({ error: msg || 'Erro na análise' }, { status: 500 })
  }
}
