import type {
  ProductAudience,
  ProductAudienceConfidence,
  ProductAnalysisAttributes,
  VariationKind,
} from '@/types'
import {
  normalizeProductAudience,
  parseAudienceConfidence,
  type NormalizeAudienceInput,
} from '@/lib/product-audience'

export type ProductAnalysisVariante = {
  /** Novo campo; alias legado: cor */
  label?:    string
  cor:       string
  corHex:    string
  kind?:     'color' | 'volume' | 'bottle' | 'model'
  fotoIndice?: number
}

export type ProductAnalysisItem = {
  nome:                 string
  descricao:            string
  categoria:            string
  audience:             ProductAudience | null
  audienceConfidence:   ProductAudienceConfidence | null
  variationKind?:       VariationKind
  attributes?:          ProductAnalysisAttributes
  variantes:            ProductAnalysisVariante[]
  fotoIndice?:          number
}

export type ParsedProductAnalysis =
  | { mode: 'single'; product: ProductAnalysisItem }
  | { mode: 'batch';  products: ProductAnalysisItem[] }

function stripCodeFences(raw: string): string {
  return raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
}

/** Extrai o primeiro valor JSON balanceado ({...} ou [...]). */
function extractBalancedJson(raw: string, open: '{' | '['): string | null {
  const close = open === '{' ? '}' : ']'
  const start = raw.indexOf(open)
  if (start < 0) return null
  let depth = 0
  let inString = false
  let escape = false
  for (let i = start; i < raw.length; i++) {
    const ch = raw[i]
    if (inString) {
      if (escape) escape = false
      else if (ch === '\\') escape = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') { inString = true; continue }
    if (ch === open) depth++
    else if (ch === close) {
      depth--
      if (depth === 0) return raw.slice(start, i + 1)
    }
  }
  return null
}

function normalizeItem(
  raw: unknown,
  index = 0,
  hintAudience?: string | null,
): ProductAnalysisItem {
  const o = raw as Record<string, unknown>
  const variantes: ProductAnalysisVariante[] = Array.isArray(o.variantes)
    ? o.variantes.map(v => {
        const x = v as Record<string, unknown>
        const label = String(x.label ?? x.cor ?? 'Único').trim()
        const cor = String(x.cor ?? label).trim()
        const kindRaw = String(x.kind ?? '').trim().toLowerCase()
        const kind =
          kindRaw === 'color' || kindRaw === 'volume' || kindRaw === 'bottle' || kindRaw === 'model'
            ? kindRaw as ProductAnalysisVariante['kind']
            : undefined
        const fotoIndice = typeof x.fotoIndice === 'number' ? x.fotoIndice : undefined
        return {
          label,
          cor,
          corHex: String(x.corHex ?? '#888888'),
          kind,
          fotoIndice,
        }
      })
    : [{ label: 'Único', cor: 'Único', corHex: '#888888' }]

  const attrsRaw = o.attributes
  let attributes: ProductAnalysisAttributes | undefined
  if (attrsRaw && typeof attrsRaw === 'object') {
    const a = attrsRaw as Record<string, unknown>
    attributes = {
      brand:          a.brand != null ? String(a.brand) : undefined,
      line:           a.line != null ? String(a.line) : undefined,
      concentration:  a.concentration != null ? String(a.concentration) : undefined,
      volumeMl:       typeof a.volumeMl === 'number' ? a.volumeMl : null,
    }
  }

  const variationKindRaw = String(o.variationKind ?? '').trim().toLowerCase()
  const variationKinds: VariationKind[] = ['color', 'volume', 'bottle', 'single', 'concentration']
  const variationKind = variationKinds.includes(variationKindRaw as VariationKind)
    ? (variationKindRaw as VariationKind)
    : undefined

  const categoria = String(o.categoria ?? 'outro')
  const confiancaRaw = o.confianca
  const confiancaSexo =
    typeof confiancaRaw === 'object' && confiancaRaw !== null
      ? (confiancaRaw as Record<string, unknown>).sexo
      : confiancaRaw

  const normInput: NormalizeAudienceInput = {
    audience:           o.audience ?? o.sexo ?? o.publico,
    audienceConfidence: o.audienceConfidence ?? confiancaSexo,
    category:           categoria,
    hintAudience,
  }
  const rawConfidence =
    parseAudienceConfidence(o.audienceConfidence) ??
    parseAudienceConfidence(confiancaSexo)

  return {
    nome:               String(o.nome ?? `Produto ${index + 1}`),
    descricao:          String(o.descricao ?? ''),
    categoria,
    audience:           normalizeProductAudience(normInput),
    audienceConfidence: rawConfidence,
    variationKind,
    attributes,
    variantes,
    fotoIndice:         typeof o.fotoIndice === 'number' ? o.fotoIndice : index,
  }
}

function normalizeParsed(
  parsed: unknown,
  hintAudience?: string | null,
): ParsedProductAnalysis {
  if (Array.isArray(parsed)) {
    const products = parsed.map((p, i) => normalizeItem(p, i, hintAudience))
    if (products.length === 1) return { mode: 'single', product: products[0] }
    return { mode: 'batch', products }
  }
  if (parsed && typeof parsed === 'object') {
    const o = parsed as Record<string, unknown>
    if (Array.isArray(o.produtos)) {
      const products = o.produtos.map((p, i) => normalizeItem(p, i, hintAudience))
      if (products.length === 1) return { mode: 'single', product: products[0] }
      return { mode: 'batch', products }
    }
    return { mode: 'single', product: normalizeItem(parsed, 0, hintAudience) }
  }
  throw new Error('IA não retornou JSON válido')
}

export function parseProductAnalysisRaw(
  raw: string,
  hintAudience?: string | null,
): ParsedProductAnalysis {
  const cleaned = stripCodeFences(raw)
  const attempts = [
    cleaned,
    extractBalancedJson(cleaned, '{'),
    extractBalancedJson(cleaned, '['),
  ].filter(Boolean) as string[]

  let lastError: Error | null = null
  for (const candidate of attempts) {
    try {
      return normalizeParsed(JSON.parse(candidate), hintAudience)
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e))
    }
  }
  throw lastError ?? new Error('IA não retornou JSON válido')
}
