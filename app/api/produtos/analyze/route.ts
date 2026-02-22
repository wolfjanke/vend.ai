import { NextRequest, NextResponse } from 'next/server'
import { anthropic, PRODUCT_ANALYSIS_PROMPT } from '@/lib/anthropic'

export const runtime = 'edge'

interface AnalysisResult {
  nome:       string
  descricao:  string
  categoria:  string
  variantes:  Array<{ cor: string; corHex: string }>
}

export async function POST(req: NextRequest) {
  try {
    const { images }: { images: string[] } = await req.json()

    if (!images?.length) {
      return NextResponse.json({ error: 'images required' }, { status: 400 })
    }

    // Limita a 10 imagens por requisição
    const sliced = images.slice(0, 10)

    const content: Array<{ type: 'image' | 'text'; source?: unknown; text?: string }> = [
      ...sliced.map(base64 => ({
        type: 'image' as const,
        source: {
          type:       'base64',
          media_type: 'image/jpeg',
          data:       base64.replace(/^data:image\/\w+;base64,/, ''),
        },
      })),
      { type: 'text' as const, text: PRODUCT_ANALYSIS_PROMPT },
    ]

    const response = await anthropic.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 512,
      messages:   [{ role: 'user', content }],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''

    let result: AnalysisResult
    try {
      result = JSON.parse(raw)
    } catch {
      // Tenta extrair JSON do texto
      const match = raw.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('IA não retornou JSON válido')
      result = JSON.parse(match[0])
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[/api/produtos/analyze]', error)
    return NextResponse.json({ error: 'Erro na análise' }, { status: 500 })
  }
}
