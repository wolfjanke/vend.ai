import type { ProductAudience, ProductAudienceConfidence } from '@/types'
import { isBeautyCategory } from '@/lib/product-catalog'

const AUDIENCE_VALUES = new Set<ProductAudience>(['feminine', 'masculine', 'unisex', 'kids'])
const CONFIDENCE_VALUES = new Set<ProductAudienceConfidence>(['alta', 'media', 'baixa'])

/** Categorias com sinal forte de público feminino adulto. */
const FEMININE_CATEGORY_SLUGS = new Set(['vestido', 'saia', 'blusa'])

/** Categorias com sinal forte de público infantil. */
const KIDS_CATEGORY_SLUGS = new Set(['infantil'])

export function parseProductAudience(raw: unknown): ProductAudience | null {
  const s = String(raw ?? '').trim().toLowerCase()
  if (s === 'fem' || s === 'feminino') return 'feminine'
  if (s === 'mas' || s === 'masc' || s === 'masculino') return 'masculine'
  if (s === 'unissex') return 'unisex'
  if (s === 'kids' || s === 'infantil') return 'kids'
  return AUDIENCE_VALUES.has(s as ProductAudience) ? (s as ProductAudience) : null
}

export function parseAudienceConfidence(raw: unknown): ProductAudienceConfidence | null {
  const s = String(raw ?? '').trim().toLowerCase()
  return CONFIDENCE_VALUES.has(s as ProductAudienceConfidence)
    ? (s as ProductAudienceConfidence)
    : null
}

function audienceFromCategory(category: string, customCategories?: { value: string; label: string }[]): ProductAudience | null {
  const c = String(category ?? '').trim().toLowerCase()
  if (KIDS_CATEGORY_SLUGS.has(c)) return 'kids'
  if (FEMININE_CATEGORY_SLUGS.has(c)) return 'feminine'
  if (isBeautyCategory(c, customCategories)) return null
  return null
}

export type NormalizeAudienceInput = {
  audience?: unknown
  audienceConfidence?: unknown
  /** Alias legado / alternativo da IA */
  confianca?: unknown
  category?: string
  /** Hint do lojista na etapa 1 — prevalece em conflito claro */
  hintAudience?: string | null
}

/**
 * Normaliza público inferido pela IA: confiança baixa → unissex,
 * salvo categoria ou hint do lojista com sinal forte.
 */
export function normalizeProductAudience(input: NormalizeAudienceInput): ProductAudience | null {
  const hintRaw = String(input.hintAudience ?? '').trim()
  if (hintRaw && hintRaw !== 'mixed') {
    const hint = parseProductAudience(hintRaw)
    if (hint) return hint
  }

  let audience = parseProductAudience(input.audience)
  const confidence =
    parseAudienceConfidence(input.audienceConfidence) ??
    parseAudienceConfidence(input.confianca)

  const fromCategory = audienceFromCategory(input.category ?? '')

  if (!audience && fromCategory) audience = fromCategory

  if (confidence === 'baixa') {
    if (fromCategory === 'kids') return 'kids'
    if (fromCategory === 'feminine') return 'feminine'
    return 'unisex'
  }

  return audience
}
