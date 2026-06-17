export type ViLinkProduct = {
  name:       string
  productUrl: string
}

const VER_PRODUTO_LINE = /^[👉\s]*Ver produto\s*$/gim
const NUMBERED_PRODUCT_BOLD = /\d+\s*—\s*\*\*([^*]+)\*\*/g
const BARE_PRODUCT_URL = /(?<!\]\()https?:\/\/[^\s<]+\/produto\/[^\s)]+/gi
const RELATIVE_PRODUCT_URL = /(?<!\]\()\/[^\s<]+\/produto\/[^\s)]+/gi

function normalizeName(value: string): string {
  return value.toLowerCase().trim()
}

function findProductUrl(name: string, products: ViLinkProduct[]): string | null {
  const target = normalizeName(name)
  if (!target) return null

  const exact = products.find(p => normalizeName(p.name) === target)
  if (exact?.productUrl) return exact.productUrl

  const partial = products.find(p => {
    const n = normalizeName(p.name)
    return n.includes(target) || target.includes(n)
  })
  return partial?.productUrl ?? null
}

function collectMentionedProducts(text: string): string[] {
  const fromBold = [...text.matchAll(NUMBERED_PRODUCT_BOLD)].map(m => m[1].trim())
  if (fromBold.length > 0) return fromBold
  return [...text.matchAll(/\d+\s*—\s*(.+)/g)]
    .map(m => m[1].replace(/\*\*/g, '').trim())
    .filter(Boolean)
}

function injectVerProdutoLinks(text: string, products: ViLinkProduct[]): string {
  const mentioned = collectMentionedProducts(text)
  let mentionIdx = 0
  let lastSingleName: string | null = null

  for (const match of text.matchAll(/\*\*([^*]+)\*\*/g)) {
    lastSingleName = match[1].trim()
  }

  return text.replace(VER_PRODUTO_LINE, line => {
    const namedUrl =
      (mentioned[mentionIdx] ? findProductUrl(mentioned[mentionIdx], products) : null) ??
      (lastSingleName ? findProductUrl(lastSingleName, products) : null)

    if (namedUrl) {
      if (mentioned[mentionIdx]) mentionIdx += 1
      const lead = line.trimStart().startsWith('👉') ? '👉 ' : ''
      return `${lead}[Ver produto](${namedUrl})`
    }

    return line
  })
}

function mergeVerProdutoWithUrlOnNextLine(text: string): string {
  return text.replace(
    /^([👉\s]*)Ver produto\s*\n\s*((?:https?:\/\/|\/)[^\s]+\/produto\/[^\s]+)\s*$/gim,
    (_, lead: string, url: string) => {
      const emoji = lead.includes('👉') ? '👉 ' : ''
      return `${emoji}[Ver produto](${url.trim()})`
    },
  )
}

function wrapBareProductUrls(text: string): string {
  const wrapLine = (line: string) => {
    if (/\[[^\]]+\]\([^)]+\)/.test(line)) return line
    return line
      .replace(BARE_PRODUCT_URL, url => `[Ver produto](${url})`)
      .replace(RELATIVE_PRODUCT_URL, url => `[Ver produto](${url})`)
  }

  return text.split('\n').map(wrapLine).join('\n')
}

/**
 * Garante links clicáveis nas respostas da Vi quando o modelo manda só "Ver produto"
 * ou URLs soltas em vez de markdown [Ver produto](url).
 */
export function enrichViProductLinks(text: string, products: ViLinkProduct[]): string {
  if (!text.trim() || products.length === 0) return text

  let result = text
  result = mergeVerProdutoWithUrlOnNextLine(result)
  result = wrapBareProductUrls(result)
  result = injectVerProdutoLinks(result, products)
  return result
}
