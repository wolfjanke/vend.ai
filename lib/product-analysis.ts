export type ProductAnalysisItem = {
  nome:       string
  descricao:  string
  categoria:  string
  variantes:  Array<{ cor: string; corHex: string }>
  fotoIndice?: number
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

function normalizeItem(raw: unknown, index = 0): ProductAnalysisItem {
  const o = raw as Record<string, unknown>
  const variantes = Array.isArray(o.variantes)
    ? o.variantes.map(v => {
        const x = v as Record<string, unknown>
        return {
          cor:     String(x.cor ?? 'Único'),
          corHex:  String(x.corHex ?? '#888888'),
        }
      })
    : [{ cor: 'Único', corHex: '#888888' }]
  return {
    nome:       String(o.nome ?? `Produto ${index + 1}`),
    descricao:  String(o.descricao ?? ''),
    categoria:  String(o.categoria ?? 'outro'),
    variantes,
    fotoIndice: typeof o.fotoIndice === 'number' ? o.fotoIndice : index,
  }
}

function normalizeParsed(parsed: unknown): ParsedProductAnalysis {
  if (Array.isArray(parsed)) {
    const products = parsed.map((p, i) => normalizeItem(p, i))
    if (products.length === 1) return { mode: 'single', product: products[0] }
    return { mode: 'batch', products }
  }
  if (parsed && typeof parsed === 'object') {
    const o = parsed as Record<string, unknown>
    if (Array.isArray(o.produtos)) {
      const products = o.produtos.map((p, i) => normalizeItem(p, i))
      if (products.length === 1) return { mode: 'single', product: products[0] }
      return { mode: 'batch', products }
    }
    return { mode: 'single', product: normalizeItem(parsed, 0) }
  }
  throw new Error('IA não retornou JSON válido')
}

export function parseProductAnalysisRaw(raw: string): ParsedProductAnalysis {
  const cleaned = stripCodeFences(raw)
  const attempts = [
    cleaned,
    extractBalancedJson(cleaned, '{'),
    extractBalancedJson(cleaned, '['),
  ].filter(Boolean) as string[]

  let lastError: Error | null = null
  for (const candidate of attempts) {
    try {
      return normalizeParsed(JSON.parse(candidate))
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e))
    }
  }
  throw lastError ?? new Error('IA não retornou JSON válido')
}
