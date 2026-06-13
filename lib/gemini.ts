import { GoogleGenerativeAI } from '@google/generative-ai'
import {
  type StoreProfile,
  type CustomCategory,
  type ViMessage,
  type ProductAnalysisHints,
  PRODUCT_CATEGORY_SLUGS,
  getCategoryDisplayLabel,
  getSegmentLabel,
} from '@/types'
import {
  inferCatalogMode,
  buildCatalogPromptBlocks,
  type CatalogMode,
} from '@/lib/product-catalog'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')

/** Modelos por função — override global legado: GEMINI_MODEL (aplica só ao viChat). */
export const GEMINI_MODELS = {
  /** Flash: cota estável no free tier; Pro costuma ter limite 0 sem billing. */
  photoAnalysis: 'gemini-2.5-flash',
  themeAnalysis: 'gemini-2.5-flash',
  viChat:        (process.env.GEMINI_MODEL ?? 'gemini-2.5-flash').trim(),
  stockSearch:   'gemini-2.5-flash-lite',
} as const

function segmentInstructions(profile: StoreProfile, catalogMode: CatalogMode): string {
  const { genderFocus, ageGroup } = profile
  const lines: string[] = []

  if (catalogMode === 'beauty') {
    if (ageGroup === 'kids') {
      lines.push('Foco infantil: colônias e produtos para criança/bebê quando aplicável.')
    } else if (ageGroup === 'all') {
      lines.push('A loja atende várias idades: diferencie fragrâncias adultas e infantis.')
    }
    if (genderFocus === 'masculine') {
      lines.push('Loja masculina: priorize fragrâncias masculinas quando a embalagem for ambígua.')
    } else if (genderFocus === 'feminine') {
      lines.push('Loja feminina: priorize fragrâncias femininas quando a embalagem for ambígua.')
    } else if (genderFocus === 'unisex') {
      lines.push('Loja unissex: fragrâncias neutras são comuns — não force feminino/masculino sem sinal no rótulo.')
    } else {
      lines.push('Loja mista: identifique masculino/feminino/unissex pelo rótulo e visual da embalagem.')
    }
    return lines.join('\n')
  }

  if (ageGroup === 'kids') {
    lines.push('Público infantil: use vocabulário adequado (criança, bebê, tamanho infantil quando fizer sentido).')
  } else if (ageGroup === 'all') {
    lines.push('A loja atende várias idades: pode haver peças adultas e infantis; descreva claramente para quem é cada item.')
  } else if (catalogMode === 'fashion') {
    lines.push('Foco em vestuário adulto.')
  }

  if (genderFocus === 'masculine') {
    lines.push('Público masculino: priorize categorias como camiseta, bermuda, calça, shorts, moletom, casaco; evite assumir que a peça é feminina.')
  } else if (genderFocus === 'feminine') {
    lines.push('Público feminino: vestidos, blusas, saias, conjuntos etc. são pertinentes quando a imagem corresponder.')
  } else if (genderFocus === 'unisex') {
    lines.push('Público unissex: descreva cortes e modelos neutros quando aplicável.')
  } else {
    lines.push('Loja mista: pode haver peças femininas e masculinas; identifique pelo corte e estilo na imagem.')
  }

  if (catalogMode === 'mixed') {
    lines.push('Esta loja também vende perfumaria/cosméticos: ao ver frasco ou embalagem de beleza, use regras de fragrância (rótulo, volume, cor do frasco) — não regras de corte de roupa.')
  }

  return lines.join('\n')
}

const AUDIENCE_CONFIDENCE_SUFFIX = '- audienceConfidence: alta | media | baixa (quão certo você está do público)'

const JSON_VARIANT_BLOCK = `  "variationKind": "color | volume | bottle | single | concentration",
  "attributes": {
    "brand": "marca se legível ou omitir",
    "line": "linha se legível ou omitir",
    "concentration": "EDT | EDP | Parfum | Colônia se visível ou omitir",
    "volumeMl": número em ml se legível ou null
  },
  "variantes": [
    {
      "label": "cor, volume (50ml) ou frasco",
      "kind": "color | volume | bottle | model",
      "corHex": "#RRGGBB"
    }
  ]`

const AUDIENCE_HINT_LABELS: Record<string, string> = {
  feminine:  'feminino',
  masculine: 'masculino',
  unisex:    'unissex',
  mixed:     'misto (feminino e masculino)',
  kids:      'infantil',
}

function formatProductHintsBlock(
  hints?: ProductAnalysisHints | null,
  customCategories?: CustomCategory[] | null,
  imageCount = 1,
): string {
  if (!hints) return ''
  const lines: string[] = []
  const mode = hints.mode ?? 'single'
  const count = hints.productCount ?? imageCount

  if (mode === 'multi') {
    lines.push(`- Quantidade informada: ${count} produto(s) diferentes`)
    lines.push(`- Fotos enviadas: ${imageCount} (1 foto por produto, mesma ordem)`)
    lines.push('- Não agrupe fotos diferentes como variações do mesmo item')
  } else {
    lines.push('- Quantidade: 1 produto (fotos extras = variações de cor ou volume/tamanho)')
  }

  const piece = hints.pieceType?.trim()
  if (piece) {
    const label = getCategoryDisplayLabel(piece, customCategories)
    lines.push(`- Tipo de produto informado pelo lojista: ${piece} (${label})`)
  }
  const aud = hints.audience?.trim()
  if (aud && AUDIENCE_HINT_LABELS[aud]) {
    lines.push(`- Público informado pelo lojista: ${AUDIENCE_HINT_LABELS[aud]}`)
  }
  const colors = hints.colorsNote?.trim()
  if (colors) lines.push(`- Cores informadas pelo lojista: ${colors}`)
  const photoVar = hints.photoVariation
  if (photoVar && photoVar !== 'unspecified') {
    const labels: Record<string, string> = {
      colors:         'cores diferentes do mesmo produto',
      volumes:        'volumes/tamanhos de frasco diferentes (ex.: 50ml e 100ml)',
      concentrations: 'concentrações diferentes (ex.: EDT vs EDP)',
    }
    lines.push(`- O que muda entre as fotos: ${labels[photoVar] ?? photoVar}`)
  }
  const note = hints.freeText?.trim()
  if (note) lines.push(`- Observação do lojista: ${note}`)
  if (!lines.length) return ''
  return `

Dados informados pelo lojista (priorize sobre a imagem se houver conflito claro):
${lines.join('\n')}`
}

function buildAnalysisRulesBlock(blocks: ReturnType<typeof buildCatalogPromptBlocks>): string {
  return `${blocks.namingRules}
${blocks.descriptionRules}
${blocks.variantRules}
${blocks.audienceRules}
${AUDIENCE_CONFIDENCE_SUFFIX}`
}

export function buildProductAnalysisPrompt(
  profile: StoreProfile,
  customCategories?: CustomCategory[] | null,
  hints?: ProductAnalysisHints | null,
  imageCount = 1,
): string {
  const std = new Set(PRODUCT_CATEGORY_SLUGS)
  const extra = (customCategories ?? [])
    .map(c => c.value)
    .filter(v => v && !std.has(v))
  const allSlugs = [...PRODUCT_CATEGORY_SLUGS, ...extra]
  const cats = allSlugs.join(' | ')
  const mode = hints?.mode ?? 'single'
  const hintsBlock = formatProductHintsBlock(hints, customCategories, imageCount)
  const catalogMode = inferCatalogMode(hints, customCategories)
  const blocks = buildCatalogPromptBlocks(catalogMode, imageCount, mode === 'multi')
  const rulesBlock = buildAnalysisRulesBlock(blocks)
  const segmentBlock = segmentInstructions(profile, catalogMode)

  if (mode === 'multi') {
    const n = hints?.productCount ?? imageCount
    return `${blocks.expertIntro}
Retorne JSON com exatamente ${n} item(ns) em "produtos" (ordem = ordem das imagens):

{
  "produtos": [
    {
      "fotoIndice": 0,
      "nome": "nome comercial",
      "descricao": "2-3 frases",
      "categoria": "slug: ${cats}",
      "audience": "feminine | masculine | unisex | kids",
      "audienceConfidence": "alta | media | baixa",
${JSON_VARIANT_BLOCK}
    }
  ]
}

Regras:
- fotoIndice começa em 0 e segue a ordem das imagens (0, 1, 2…)
- Cada produto tem UMA variante principal naquela foto
- Não misture fotos diferentes no mesmo produto
- categoria: um slug da lista (${cats}); use categoria customizada da loja para perfumes/beleza quando aplicável; "outro" só se nada encaixar
${rulesBlock}

Contexto da loja:
${getSegmentLabel(profile)}

Instruções por segmento:
${segmentBlock}${hintsBlock}

Retorne APENAS o JSON, sem markdown, sem explicação extra.`
  }

  return `${blocks.expertIntro}
Retorne um JSON com:

{
  "nome": "nome comercial do produto",
  "descricao": "descrição de 2-3 frases",
  "categoria": "exatamente um destes valores: ${cats}",
  "audience": "feminine | masculine | unisex | kids",
  "audienceConfidence": "alta | media | baixa",
${JSON_VARIANT_BLOCK}
}

O campo "categoria" deve ser um slug da lista acima (categorias extras da loja incluem perfumes etc.).
Se houver múltiplas fotos do mesmo item (cores ou volumes diferentes), liste cada foto como variante com label e kind adequados; use variationKind coerente.
${rulesBlock}

Contexto da loja:
${getSegmentLabel(profile)}

Instruções por segmento:
${segmentBlock}${hintsBlock}

Retorne APENAS o JSON, sem markdown, sem explicação extra.`
}

/** Análise de foto no cadastro de produto. */
export async function analyzeProductPhoto(
  images: string[],
  productPrompt: string,
): Promise<string> {
  const sliced = images.slice(0, 10)
  const parts: Array<{ inlineData: { mimeType: string; data: string } } | { text: string }> = [
    ...sliced.map(base64 => ({
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64.replace(/^data:image\/\w+;base64,/, ''),
      },
    })),
    { text: productPrompt },
  ]

  const model = genAI.getGenerativeModel({ model: GEMINI_MODELS.photoAnalysis })
  const result = await model.generateContent({
    contents: [{ role: 'user', parts }],
  })
  return result.response.text?.() ?? ''
}

export type ViChatOptions = {
  messages:       ViMessage[]
  systemPrompt:   string
  model?:         string
  stream?:        boolean
}

function mapViContents(messages: ViMessage[]) {
  return messages.map(m => ({
    role: m.role === 'user' ? ('user' as const) : ('model' as const),
    parts: [{ text: m.content }],
  }))
}

/** Histórico válido para o Gemini: começa no 1.º user e alterna papéis. */
export function sanitizeViMessagesForGemini(messages: ViMessage[]): ViMessage[] {
  let start = 0
  while (start < messages.length && messages[start].role !== 'user') start++
  const slice = messages.slice(start)
  if (!slice.length) return []

  const out: ViMessage[] = []
  for (const m of slice) {
    const prev = out[out.length - 1]
    if (prev?.role === m.role) {
      out[out.length - 1] = { role: m.role, content: `${prev.content}\n\n${m.content}` }
    } else {
      out.push({ ...m })
    }
  }
  return out
}

function extractChunkText(chunk: unknown): string {
  if (typeof (chunk as { text?: () => string }).text === 'function') {
    return (chunk as { text: () => string }).text()
  }
  return (
    (chunk as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> })
      .candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  )
}

/** Resposta da Vi — streaming (planos pagos) ou texto direto (grátis). */
export async function viChatResponse(options: ViChatOptions): Promise<Response | string> {
  const modelName = options.model ?? GEMINI_MODELS.viChat
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: options.systemPrompt,
  })
  const contents = mapViContents(sanitizeViMessagesForGemini(options.messages))
  if (!contents.length) {
    throw new Error('Nenhuma mensagem do cliente para responder')
  }

  if (options.stream) {
    const result = await model.generateContentStream({ contents })
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = extractChunkText(chunk)
            if (text) controller.enqueue(encoder.encode(text))
          }
        } finally {
          controller.close()
        }
      },
    })
    return new Response(readable, {
      headers: {
        'Content-Type':  'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    })
  }

  const result = await model.generateContent({ contents })
  return result.response.text?.() ?? ''
}

export { genAI }
