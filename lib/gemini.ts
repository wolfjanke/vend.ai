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

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')

/** Modelos por função — override global legado: GEMINI_MODEL (aplica só ao viChat). */
export const GEMINI_MODELS = {
  /** Flash: cota estável no free tier; Pro costuma ter limite 0 sem billing. */
  photoAnalysis: 'gemini-2.5-flash',
  themeAnalysis: 'gemini-2.5-flash',
  viChat:        (process.env.GEMINI_MODEL ?? 'gemini-2.5-flash').trim(),
  stockSearch:   'gemini-2.5-flash-lite',
} as const

function segmentInstructions(profile: StoreProfile): string {
  const { genderFocus, ageGroup } = profile
  const lines: string[] = []
  if (ageGroup === 'kids') {
    lines.push('Público infantil: use vocabulário adequado (criança, bebê, tamanho infantil quando fizer sentido).')
  } else if (ageGroup === 'all') {
    lines.push('A loja atende várias idades: pode haver peças adultas e infantis; descreva claramente para quem é cada item.')
  } else {
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
  return lines.join('\n')
}

/** @deprecated Prefer server-side buildViSystemPrompt from lib/vi-prompt.ts */
export { buildViSystemPrompt } from '@/lib/vi-prompt'

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
): string {
  if (!hints) return ''
  const lines: string[] = []
  const piece = hints.pieceType?.trim()
  if (piece) {
    const label = getCategoryDisplayLabel(piece, customCategories)
    lines.push(`- Tipo de peça informado pelo lojista: ${piece} (${label})`)
  }
  const aud = hints.audience?.trim()
  if (aud && AUDIENCE_HINT_LABELS[aud]) {
    lines.push(`- Público informado pelo lojista: ${AUDIENCE_HINT_LABELS[aud]}`)
  }
  const colors = hints.colorsNote?.trim()
  if (colors) lines.push(`- Cores informadas pelo lojista: ${colors}`)
  const note = hints.freeText?.trim()
  if (note) lines.push(`- Observação do lojista: ${note}`)
  if (!lines.length) return ''
  return `

Dados informados pelo lojista (priorize sobre a imagem se houver conflito claro):
${lines.join('\n')}`
}

export function buildProductAnalysisPrompt(
  profile: StoreProfile,
  customCategories?: CustomCategory[] | null,
  hints?: ProductAnalysisHints | null,
): string {
  const std = new Set(PRODUCT_CATEGORY_SLUGS)
  const extra = (customCategories ?? [])
    .map(c => c.value)
    .filter(v => v && !std.has(v))
  const allSlugs = [...PRODUCT_CATEGORY_SLUGS, ...extra]
  const cats = allSlugs.join(' | ')
  return `Você é um especialista em moda e vestuário (loja de roupas em geral). Analise as imagens de produtos enviadas e retorne um JSON com:

{
  "nome": "nome comercial do produto",
  "descricao": "descrição de 2-3 frases sobre o produto (tecido, estilo, ocasião ou uso)",
  "categoria": "exatamente um destes valores: ${cats}",
  "variantes": [
    {
      "cor": "nome da cor em português",
      "corHex": "#RRGGBB (cor aproximada)"
    }
  ]
}

Contexto da loja:
${getSegmentLabel(profile)}

Instruções por segmento:
${segmentInstructions(profile)}

Se houver múltiplas fotos com cores diferentes, liste cada cor como uma variante separada.
O campo "categoria" deve ser obrigatoriamente um dos slugs listados acima (use "outro" se nenhum encaixar bem). Os slugs extras após os padrões são categorias da própria loja — prefira o mais adequado à imagem.${formatProductHintsBlock(hints, customCategories)}

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
  const contents = mapViContents(options.messages)

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

/** Busca semântica no estoque — modelo leve. */
export async function searchStock(query: string, catalogSummary: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: GEMINI_MODELS.stockSearch })
  const prompt = `Com base no catálogo abaixo, responda em português do Brasil de forma curta (máx. 3 frases) à busca do cliente.

Catálogo:
${catalogSummary}

Busca: ${query}`

  const result = await model.generateContent(prompt)
  return result.response.text?.() ?? ''
}

/** @deprecated Use GEMINI_MODELS.viChat */
export const MODEL = GEMINI_MODELS.viChat

export { genAI }
