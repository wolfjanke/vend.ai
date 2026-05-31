import { GoogleGenerativeAI } from '@google/generative-ai'
import {
  type StoreContext,
  type StoreProfile,
  type CustomCategory,
  type ViMessage,
  PRODUCT_CATEGORY_SLUGS,
  getSegmentLabel,
} from '@/types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')

/** Modelos por função — override global legado: GEMINI_MODEL (aplica só ao viChat). */
export const GEMINI_MODELS = {
  photoAnalysis: 'gemini-2.5-pro',
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

export function buildViSystemPrompt(ctx: StoreContext): string {
  const productLines = ctx.products
    .map(p => {
      const sizes  = p.sizes.join(', ') || 'indisponível'
      const colors = p.colors.join(', ') || '-'
      const stock  = p.inStock ? '✓ em estoque' : '✗ esgotado'
      return `- ${p.name} (${p.category}) | R$${Number(p.price).toFixed(2)} | Cores: ${colors} | Tamanhos: ${sizes} | ${stock}`
    })
    .join('\n')

  const frete = ctx.freteInfo?.trim() || 'Consulte a loja.'
  const pagamento = ctx.pagamentoInfo?.trim() || 'Consulte a loja.'
  const segment =
    ctx.segmentLabel?.trim() ||
    (ctx.genderFocus && ctx.ageGroup
      ? getSegmentLabel({ genderFocus: ctx.genderFocus, ageGroup: ctx.ageGroup })
      : 'Loja de roupas e vestuário.')

  return `Você é a Vi, assistente virtual da loja "${ctx.name}" no vend.ai.
Sua missão é ajudar clientes a encontrar a roupa ideal e concluir a compra.

## PERFIL DA LOJA
${segment}

## ESTOQUE ATUAL
${productLines || 'Nenhum produto cadastrado ainda.'}

## INFORMAÇÕES DA LOJA
- Frete: ${frete}
- Formas de pagamento / promoções: ${pagamento}

## DIRETRIZES
- Seja simpática, próxima e use emojis com moderação
- Quando o cliente descrever o que quer, sugira produtos específicos do estoque acima
- Sempre mencione o preço e tamanhos disponíveis ao sugerir um produto
- Se um produto estiver esgotado, não o sugira (a menos que o cliente pergunte diretamente)
- Se não souber responder ou o cliente quiser falar com uma humana, diga: "Vou te conectar com nossa vendedora no WhatsApp!"
- Quando perguntarem sobre frete, entrega ou cidades, use as informações de "Frete" acima
- Quando perguntarem sobre pagamento, PIX, parcelamento ou descontos, use as informações de "Formas de pagamento" acima
- Seja direta: no máximo 3 frases por resposta
- Nunca invente produtos que não existem no estoque acima
- Fale sempre em português do Brasil`
}

export function buildProductAnalysisPrompt(
  profile: StoreProfile,
  customCategories?: CustomCategory[] | null,
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
O campo "categoria" deve ser obrigatoriamente um dos slugs listados acima (use "outro" se nenhum encaixar bem). Os slugs extras após os padrões são categorias da própria loja — prefira o mais adequado à imagem.
Retorne APENAS o JSON, sem markdown, sem explicação extra.`
}

/** Análise de foto no cadastro de produto — modelo Pro. */
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
