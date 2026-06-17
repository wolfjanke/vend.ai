import type { CatalogMode } from '@/lib/product-catalog'
import { isBeautyCategory } from '@/lib/product-catalog'
import type { ProductAnalysisItem, ProductAnalysisVariante } from '@/lib/product-analysis'
import type {
  CatalogAxes,
  ProductAnalysisAttributes,
  ProductAnalysisHints,
  VariationKind,
  VariantType,
  StockAxis,
} from '@/types'
import { CLOTHING_SIZES, isNumericStockKey, isVolumeStockKey, stockKeysForAxes, VOLUME_PRESETS } from '@/types'

export type MappedVariantDraft = {
  id:            string
  color:         string
  colorHex:      string
  stock:         Record<string, number>
  stockPrices?:  Record<string, number>
  variantType:   VariantType
  /** Índices de fotos (filesSnapshot) para esta variante. */
  photoIndices:  number[]
}

export type AnalysisAiMeta = {
  variationKind:   VariationKind
  attributes?:     ProductAnalysisAttributes
  volumeLabels?:   string[]
  confidenceNotes?: string[]
}

export type MappedAnalysisDraft = {
  catalogAxes: CatalogAxes
  variants:    MappedVariantDraft[]
  aiMeta:      AnalysisAiMeta
}

const VOLUME_LABEL_PATTERN = /^\d+\s*ml$/i

/** Normaliza label de volume: "50 ml" → "50ml". */
export function normalizeVolumeLabel(raw: string): string {
  const t = String(raw ?? '').trim()
  const m = t.match(/^(\d+)\s*ml$/i)
  if (m) return `${m[1]}ml`
  return t
}

function isVolumeLabel(label: string): boolean {
  return VOLUME_LABEL_PATTERN.test(String(label ?? '').trim()) || isVolumeStockKey(label)
}

function emptyStock(keys: string[]): Record<string, number> {
  return Object.fromEntries(keys.map(k => [k, 0]))
}

function inferVariationKind(
  item: ProductAnalysisItem,
  hints?: ProductAnalysisHints | null,
  catalogMode?: CatalogMode,
): VariationKind {
  if (item.variationKind) return item.variationKind

  const hint = hints?.photoVariation
  if (hint === 'volumes') return 'volume'
  if (hint === 'colors') return 'color'
  if (hint === 'concentrations') return 'concentration'

  const labels = item.variantes.map(v => v.label ?? v.cor)
  const allVolume = labels.length > 0 && labels.every(isVolumeLabel)
  if (allVolume && labels.length > 1) return 'volume'

  const kinds = item.variantes.map(v => v.kind).filter(Boolean)
  if (kinds.includes('volume')) return 'volume'

  if (catalogMode === 'beauty' || isBeautyCategory(item.categoria)) {
    if (labels.length === 1 && isVolumeLabel(labels[0])) return 'volume'
    if (labels.length === 1) return 'bottle'
  }

  if (item.variantes.length > 1) return 'color'
  return 'single'
}

function variantLineName(item: ProductAnalysisItem): string {
  const attrs = item.attributes
  if (attrs?.line?.trim()) return attrs.line.trim()
  if (attrs?.brand?.trim()) return attrs.brand.trim()
  return 'Único'
}

function axesForKind(kind: VariationKind): CatalogAxes {
  switch (kind) {
    case 'volume':
      return { primaryAxis: 'none', stockAxis: 'volume' }
    case 'color':
      return { primaryAxis: 'color', stockAxis: 'clothing' }
    case 'concentration':
      return { primaryAxis: 'model', stockAxis: 'unique' }
    case 'bottle':
      return { primaryAxis: 'model', stockAxis: 'unique' }
  }
  return { primaryAxis: 'none', stockAxis: 'unique' }
}

function distributePhotoIndices(count: number, variantCount: number): number[][] {
  if (variantCount <= 0) return []
  if (count === 0) return Array.from({ length: variantCount }, () => [])
  if (count >= variantCount) {
    const result: number[][] = []
    for (let i = 0; i < variantCount - 1; i++) result.push([i])
    result.push(Array.from({ length: count - variantCount + 1 }, (_, j) => variantCount - 1 + j))
    return result
  }
  return Array.from({ length: variantCount }, (_, i) => (i < count ? [i] : []))
}

/**
 * Mapeia item parseado da IA → estrutura de variantes + eixos de catálogo.
 */
export function mapAnalysisToVariantDraft(
  item: ProductAnalysisItem,
  catalogMode: CatalogMode,
  hints?: ProductAnalysisHints | null,
  imageCount = 1,
): MappedAnalysisDraft {
  const kind = inferVariationKind(item, hints, catalogMode)
  const catalogAxes = axesForKind(kind)
  const rawVariantes = item.variantes.length ? item.variantes : [{ label: 'Único', cor: 'Único', corHex: '#888888' }]

  const aiMeta: AnalysisAiMeta = {
    variationKind: kind,
    attributes:    item.attributes,
    volumeLabels:  kind === 'volume' ? rawVariantes.map(v => normalizeVolumeLabel(v.label ?? v.cor)) : undefined,
  }

  if (item.audienceConfidence === 'baixa' && item.attributes?.volumeMl == null) {
    aiMeta.confidenceNotes = ['Volume/concentração com confiança baixa — confira no rótulo.']
  }

  if (kind === 'volume') {
    const volumeLabels = rawVariantes.map(v => normalizeVolumeLabel(v.label ?? v.cor))
    const stockKeys = [...new Set(volumeLabels)]
    const hex = rawVariantes[0]?.corHex ?? '#888888'
    const allPhotoIndices = Array.from({ length: imageCount }, (_, i) => i)
    return {
      catalogAxes,
      variants: [{
        id:           crypto.randomUUID(),
        color:        variantLineName(item),
        colorHex:     hex,
        stock:        emptyStock(stockKeys.length ? stockKeys : VOLUME_PRESETS.slice(0, 3)),
        variantType:  'modelo',
        photoIndices: allPhotoIndices,
      }],
      aiMeta,
    }
  }

  if (kind === 'concentration') {
    const variants: MappedVariantDraft[] = rawVariantes.map((v, i) => ({
      id:           crypto.randomUUID(),
      color:        v.label ?? v.cor,
      colorHex:     v.corHex ?? '#888888',
      stock:        emptyStock(['Único']),
      variantType:  'modelo',
      photoIndices: typeof v.fotoIndice === 'number' ? [v.fotoIndice] : (i < imageCount ? [i] : []),
    }))
    return { catalogAxes, variants, aiMeta }
  }

  if (kind === 'bottle' || kind === 'single') {
    const v = rawVariantes[0]
    return {
      catalogAxes,
      variants: [{
        id:           crypto.randomUUID(),
        color:        v.label ?? v.cor ?? 'Único',
        colorHex:     v.corHex ?? '#888888',
        stock:        emptyStock(['Único']),
        variantType:  catalogMode === 'beauty' ? 'modelo' : 'cor',
        photoIndices: Array.from({ length: imageCount }, (_, i) => i),
      }],
      aiMeta,
    }
  }

  // color (moda) — N variantes por cor
  const hasExplicitIndices = rawVariantes.some(v => typeof v.fotoIndice === 'number')
  const photoBuckets = hasExplicitIndices
    ? rawVariantes.map(v => (typeof v.fotoIndice === 'number' ? [v.fotoIndice] : []))
    : distributePhotoIndices(imageCount, rawVariantes.length)
  const variants: MappedVariantDraft[] = rawVariantes.map((v, i) => ({
    id:           crypto.randomUUID(),
    color:        v.label ?? v.cor,
    colorHex:     v.corHex ?? '#888888',
    stock:        emptyStock(CLOTHING_SIZES),
    variantType:  'cor',
    photoIndices: photoBuckets[i] ?? [],
  }))

  return {
    catalogAxes: { primaryAxis: 'color', stockAxis: 'clothing' },
    variants,
    aiMeta,
  }
}

/** Remove marca do nome/atributos quando o lojista não autorizou. */
export function sanitizeBrandFromAnalysis(
  item: ProductAnalysisItem,
  includeBrand: boolean,
): { item: ProductAnalysisItem; brand: string | null } {
  const rawBrand = item.attributes?.brand?.trim() || null
  if (includeBrand) {
    return { item, brand: rawBrand }
  }

  let nome = item.nome
  if (rawBrand) {
    const escaped = rawBrand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const prefix = new RegExp(`^${escaped}\\s*[-–—]?\\s*`, 'i')
    if (prefix.test(nome)) {
      nome = nome.replace(prefix, '').trim()
    }
  }

  if (!item.attributes?.brand) {
    return { item: { ...item, nome }, brand: null }
  }

  const { brand: _removed, ...restAttrs } = item.attributes
  const attributes = Object.keys(restAttrs).length
    ? (restAttrs as ProductAnalysisAttributes)
    : undefined

  return {
    item: { ...item, nome, attributes },
    brand: null,
  }
}

/** Reconstrói stock keys ao editar produto existente. */
export function stockAxisFromProduct(
  catalogAxes?: CatalogAxes | null,
  variants?: Array<{ stock?: Record<string, number> }>,
): StockAxis {
  if (catalogAxes?.stockAxis) return catalogAxes.stockAxis
  const keys = variants?.flatMap(v => Object.keys(v.stock ?? {})) ?? []
  if (keys.some(isVolumeStockKey)) return 'volume'
  if (keys.some(isNumericStockKey)) return 'numeric'
  if (keys.length === 1 && keys[0] === 'Único') return 'unique'
  return 'clothing'
}

export function mergeStockKeysForVariant(
  stockAxis: StockAxis,
  existing?: Record<string, number> | null,
): string[] {
  return stockKeysForAxes(stockAxis, existing)
}
