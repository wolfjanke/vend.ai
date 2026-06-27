import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import { analyzeProductPhoto, buildProductAnalysisPrompt, GEMINI_MODELS } from '@/lib/gemini'
import { parseProductAnalysisRaw, type ProductAnalysisItem } from '@/lib/product-analysis'
import { mapAnalysisToVariantDraft, sanitizeBrandFromAnalysis } from '@/lib/product-analysis-map'
import { inferCatalogMode, type CatalogMode } from '@/lib/product-catalog'
import type { StoreSettings, ProductAnalysisHints, ProductBlockHint } from '@/types'
import { getStoreProfile, normalizeProductCategory } from '@/types'
import { logServerError } from '@/lib/logger'
import type { PlanSlug } from '@/lib/plans'
import { checkPhotoAnalysisLimit, incrementPhotoAnalysis } from '@/lib/photo-analysis-limits'
import { checkPhotoAnalyzeBurstRateLimit } from '@/lib/store-rate-limit'
import {
  MAX_PRODUCT_BLOCKS,
  MAX_PHOTOS_TOTAL,
  countBlockPhotos,
} from '@/lib/product-photo-blocks'
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
  includeBrand = false,
) {
  const normalized = normalizeItem(item, customSlugs)
  const rawBrand = normalized.attributes?.brand?.trim() || null
  const { item: sanitized, brand } = sanitizeBrandFromAnalysis(normalized, includeBrand)
  const mapped = mapAnalysisToVariantDraft(sanitized, catalogMode, hints, imageCount)
  return {
    ...sanitized,
    brand,
    brandSuppressed: !includeBrand && Boolean(rawBrand),
    catalogAxes: mapped.catalogAxes,
    aiMeta:      mapped.aiMeta,
    variantDrafts: mapped.variants,
  }
}

function blockHintsToAnalysisHints(
  blockHints?: ProductBlockHint | null,
): ProductAnalysisHints | null {
  if (!blockHints) return null
  return {
    mode:           'single',
    pieceType:      blockHints.pieceType,
    audience:       blockHints.audience,
    colorsNote:     blockHints.colorsNote,
    freeText:       blockHints.freeText,
    photoVariation: blockHints.photoVariation,
  }
}

function validateBlockGroups(
  groups: ProductAnalysisHints['groups'],
  imageCount: number,
): string | null {
  if (!groups?.length) return 'Informe ao menos um bloco de produto.'
  if (groups.length > MAX_PRODUCT_BLOCKS) {
    return `Máximo de ${MAX_PRODUCT_BLOCKS} produtos por análise. Cadastre o restante em outra leva.`
  }
  const total = countBlockPhotos(groups)
  if (total !== imageCount) {
    return 'Os blocos não batem com o número de imagens enviadas.'
  }
  if (total > MAX_PHOTOS_TOTAL) {
    return `Máximo de ${MAX_PHOTOS_TOTAL} imagens por análise.`
  }
  const seen = new Set<number>()
  for (const g of groups) {
    if (!g.imageIndices.length) return 'Cada produto precisa de ao menos uma foto.'
    for (const idx of g.imageIndices) {
      if (idx < 0 || idx >= imageCount) return 'Índice de imagem inválido nos blocos.'
      if (seen.has(idx)) return 'A mesma foto não pode aparecer em dois produtos.'
      seen.add(idx)
    }
  }
  if (seen.size !== imageCount) return 'Todas as imagens devem estar em algum bloco.'
  return null
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
          error: photoLimit.limit === 0
            ? 'Análise de foto com IA disponível nos planos pagos. Faça upgrade para usar.'
            : photoLimit.limit != null
              ? `Limite de análises por IA atingido este mês (${photoLimit.limit}). Faça upgrade para continuar.`
              : 'Análise indisponível.',
        },
        { status: 403 },
      )
    }

    if (!(await checkPhotoAnalyzeBurstRateLimit(session.storeId))) {
      return NextResponse.json(
        { error: 'Limite de análises por hora atingido. Aguarde e tente novamente.' },
        { status: 429 },
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

    if (images.length > MAX_PHOTOS_TOTAL) {
      return NextResponse.json({ error: `Máximo de ${MAX_PHOTOS_TOTAL} imagens por análise` }, { status: 400 })
    }

    const mode = hints?.mode ?? 'single'

    if (mode === 'blocks') {
      const groupError = validateBlockGroups(hints?.groups, images.length)
      if (groupError) {
        return NextResponse.json({ error: groupError }, { status: 400 })
      }
    }

    const catalogMode = inferCatalogMode(hints, customCats)
    const productPrompt = buildProductAnalysisPrompt(profile, customCats, hints, images.length)

    const raw = await analyzeProductPhoto(images, productPrompt)
    const parsed = parseProductAnalysisRaw(raw, hints?.audience ?? null)

    await incrementPhotoAnalysis(session.storeId)

    if (mode === 'blocks' && hints?.groups?.length) {
      const products =
        parsed.mode === 'batch' ? parsed.products : [parsed.product]
      const produtos = hints.groups.map((group, i) => {
        const item = products[i] ?? products[products.length - 1]
        const perBlockHints = blockHintsToAnalysisHints(group.hints)
        const catalogForBlock = inferCatalogMode(perBlockHints ?? hints, customCats)
        return enrichAnalysisItem(
          item,
          customSlugs,
          catalogForBlock,
          perBlockHints,
          group.imageIndices.length,
          group.hints?.includeBrand ?? false,
        )
      })
      return NextResponse.json({ batch: true, produtos, mode: 'blocks' })
    }

    if (parsed.mode === 'batch') {
      const photosPerProduct = Math.max(1, hints?.photosPerProduct ?? 1)
      const produtos = parsed.products.map((p, i) =>
        enrichAnalysisItem(p, customSlugs, catalogMode, hints, photosPerProduct > 1 ? photosPerProduct : 1),
      )
      return NextResponse.json({ batch: true, produtos, photosPerProduct })
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
        { error: 'A IA retornou um formato inválido. Tente de novo ou ajuste os blocos de produto.' },
        { status: 502 },
      )
    }
    return NextResponse.json({ error: msg || 'Erro na análise' }, { status: 500 })
  }
}
