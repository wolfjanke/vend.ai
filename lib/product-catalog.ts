import type { CustomCategory, ProductAnalysisHints } from '@/types'
import { PRODUCT_CATEGORY_SLUGS } from '@/types'

/** Contexto de catálogo para o prompt de análise de foto. */
export type CatalogMode = 'fashion' | 'beauty' | 'mixed'

const BEAUTY_PATTERN =
  /perfum|fragr|cosmet|belez|col[oô]ni|skincare|maquiagem|hidrat|sabon|body\s*splash|\bdeo\b|desodor|essential\s*oil|óleo\s*corporal/i

const FASHION_SLUGS = new Set(
  PRODUCT_CATEGORY_SLUGS.filter(s => s !== 'outro'),
)

export function isBeautyCategory(
  slug: string,
  customCategories?: CustomCategory[] | null,
): boolean {
  const s = String(slug ?? '').trim()
  if (!s) return false
  if (BEAUTY_PATTERN.test(s)) return true
  const custom = customCategories?.find(c => c.value === s)
  if (custom && BEAUTY_PATTERN.test(custom.label)) return true
  return false
}

function isFashionCategorySlug(slug: string): boolean {
  return FASHION_SLUGS.has(String(slug ?? '').trim().toLowerCase())
}

/**
 * Define o modo do prompt: moda, beleza/perfumaria, ou loja mista.
 * Hint "tipo de peça" na etapa 1 tem prioridade.
 */
export function inferCatalogMode(
  hints?: ProductAnalysisHints | null,
  customCategories?: CustomCategory[] | null,
): CatalogMode {
  const piece = hints?.pieceType?.trim()
  if (piece) {
    if (isBeautyCategory(piece, customCategories)) return 'beauty'
    if (isFashionCategorySlug(piece)) return 'fashion'
    return 'mixed'
  }

  const customs = customCategories ?? []
  const hasBeauty = customs.some(c => isBeautyCategory(c.value, customs))
  const hasNonBeautyCustom = customs.some(c => !isBeautyCategory(c.value, customs))

  if (hasBeauty && hasNonBeautyCustom) return 'mixed'
  if (hasBeauty) return 'beauty'
  return 'fashion'
}

export function getCatalogModeLabel(mode: CatalogMode): string {
  if (mode === 'beauty') return 'perfumaria e cosméticos'
  if (mode === 'mixed') return 'moda, perfumaria e outros produtos'
  return 'moda e vestuário'
}

function expertIntro(mode: CatalogMode, imageCount: number, multi: boolean, photosPerProduct = 1): string {
  const domain = getCatalogModeLabel(mode)
  if (multi && photosPerProduct > 1) {
    return `Você é especialista em cadastro de produtos para e-commerce (${domain}). Analise as ${imageCount} imagem(ns) agrupadas em vários PRODUTOS DIFERENTES — cada grupo de ${photosPerProduct} fotos consecutivas é um produto com variações (cores ou volumes). Use apenas a imagem e seu conhecimento prévio do modelo — NÃO invente busca na internet.`
  }
  if (multi) {
    return `Você é especialista em cadastro de produtos para e-commerce (${domain}). Analise as ${imageCount} imagem(ns) — cada uma é um PRODUTO DIFERENTE. Use apenas a imagem e seu conhecimento prévio do modelo — NÃO invente busca na internet.`
  }
  return `Você é especialista em cadastro de produtos para e-commerce (${domain}). Analise a(s) imagem(ns) enviada(s). Use apenas a imagem e seu conhecimento prévio do modelo — NÃO invente busca na internet.`
}

const FASHION_NAMING = `- nome: curto e comercial (até ~6 palavras) — ex.: "Regata Preta Brasil", "Vestido Midi Floral"
- Leia estampa/cor/modelo visíveis; não invente marca se não aparecer`

const BEAUTY_NAMING = `- nome: curto e comercial (até ~6 palavras) — priorize texto LEGÍVEL na embalagem (marca + linha + concentração/volume se visíveis)
- Ex.: "Dior Sauvage EDT", "Perfume Floral 100ml", "Body Splash Morango"
- Se reconhecer frasco/embalagem icônicos pelo visual, use o nome comercial conhecido — mas NÃO invente edição, volume ou SKU que não estejam visíveis
- Se o rótulo estiver ilegível: descreva genericamente — ex.: "Perfume Masculino Frasco Azul", "Colônia Infantil Frasco Rosa"
- NUNCA afirme ter pesquisado na web`

const MIXED_NAMING = `- Primeiro identifique se o item é vestuário, fragrância/cosmético ou outro
- Vestuário: modelo + cor + detalhe (ex.: "Camiseta Oversized Preta")
- Perfume/cosmético: marca/linha legíveis na embalagem, ou descrição visual genérica se ilegível
- Outros (bolsa, relógio etc.): marca/modelo visíveis ou descrição objetiva do item`

const FASHION_DESC = `- descricao: 2 frases sobre tecido aparente, corte, estilo e ocasião de uso`

const BEAUTY_DESC = `- descricao: 2 frases sobre tipo (EDT/EDP/colônia/body splash etc. se visível), ocasião, família olfativa ou benefício APENAS se inferível do nome/embalagem ou do seu conhecimento do produto reconhecido
- Não invente notas olfativas específicas se não tiver certeza; prefira "fragrância fresca masculina" a uma lista fabricada de notas`

const MIXED_DESC = `- descricao: adapte ao tipo — vestuário (tecido/corte/uso) ou beleza (tipo de fragrância/ocasião) ou outro (material/uso)`

const FASHION_VARIANTS = `- variationKind: color (padrão para vestuário)
- variantes: cor da peça; múltiplas fotos com cores diferentes = uma variante por cor, kind color
- corHex: cor dominante visível`

const BEAUTY_VARIANTS = `- variationKind: volume se fotos mostram frascos de tamanhos diferentes; bottle/single se um frasco; concentration se só muda EDT/EDP
- variantes: use label + kind — volume (50ml, 100ml) OU cor/tampa do frasco OU concentração (EDT, EDP)
- Múltiplas fotos do mesmo perfume em volumes diferentes → variationKind volume, uma entrada em variantes por volume
- corHex: cor dominante do vidro/embalagem`

const MIXED_VARIANTS = `- variantes: para vestuário = cor; para perfume = cor do frasco ou volume; para outros = cor/material principal
- corHex: cor dominante visível`

const FASHION_AUDIENCE = `Inferência de público — VESTUÁRIO (campo "audience"):
- Valores: feminine | masculine | unisex | kids
- Use silhueta e corte — NÃO use só a cor
- feminine: vestido, saia, modelagem feminina clara
- masculine: corte masculino clássico
- kids: peça infantil visível
- unisex: básicos boxy/oversized ambíguos
- Vestido/saia → feminine (confiança alta) salvo hint em contrário
- Ambíguo → unisex + audienceConfidence baixa`

const BEAUTY_AUDIENCE = `Inferência de público — PERFUMARIA/BELEZA (campo "audience"):
- Valores: feminine | masculine | unisex | kids
- Leia rótulo: "Pour Homme", "For Men", "Masculino" → masculine; "Pour Femme", "Femme", "Feminino" → feminine
- Linhas infantil/colônia baby → kids
- Muitas fragrâncias são unisex — prefira unisex se não houver sinal claro no rótulo/embalagem
- NÃO use regras de corte de roupa
- Ambíguo → unisex + audienceConfidence baixa`

const MIXED_AUDIENCE = `Inferência de público (campo "audience"):
- Aplique regras de vestuário OU de perfumaria conforme o tipo identificado na imagem
- Valores: feminine | masculine | unisex | kids
- audienceConfidence: alta | media | baixa`

function rulesFor(mode: CatalogMode, kind: 'naming' | 'desc' | 'variants' | 'audience'): string {
  if (mode === 'beauty') {
    if (kind === 'naming') return BEAUTY_NAMING
    if (kind === 'desc') return BEAUTY_DESC
    if (kind === 'variants') return BEAUTY_VARIANTS
    return BEAUTY_AUDIENCE
  }
  if (mode === 'mixed') {
    if (kind === 'naming') return MIXED_NAMING
    if (kind === 'desc') return MIXED_DESC
    if (kind === 'variants') return MIXED_VARIANTS
    return MIXED_AUDIENCE
  }
  if (kind === 'naming') return FASHION_NAMING
  if (kind === 'desc') return FASHION_DESC
  if (kind === 'variants') return FASHION_VARIANTS
  return FASHION_AUDIENCE
}

export type CatalogPromptBlocks = {
  mode:           CatalogMode
  expertIntro:    string
  namingRules:    string
  descriptionRules: string
  variantRules:   string
  audienceRules:  string
}

export function buildCatalogPromptBlocks(
  mode: CatalogMode,
  imageCount: number,
  multi: boolean,
  photosPerProduct = 1,
): CatalogPromptBlocks {
  return {
    mode,
    expertIntro:      expertIntro(mode, imageCount, multi, photosPerProduct),
    namingRules:        rulesFor(mode, 'naming'),
    descriptionRules:   rulesFor(mode, 'desc'),
    variantRules:       rulesFor(mode, 'variants'),
    audienceRules:      rulesFor(mode, 'audience'),
  }
}
