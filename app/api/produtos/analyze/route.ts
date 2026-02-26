import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import { genAI, MODEL, PRODUCT_ANALYSIS_PROMPT } from '@/lib/gemini'

interface AnalysisResult {
  nome:       string
  descricao:  string
  categoria:  string
  variantes:  Array<{ cor: string; corHex: string }>
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const planRows = await sql`SELECT plan FROM stores WHERE id = ${session.storeId} LIMIT 1`
    const plan = planRows[0]?.plan ?? 'free'
    if (plan === 'free') {
      return NextResponse.json(
        { error: 'IA no cadastro de produto está disponível nos planos pagos. Faça upgrade para usar.' },
        { status: 403 }
      )
    }

    const { images }: { images: string[] } = await req.json()

    if (!images?.length) {
      return NextResponse.json({ error: 'images required' }, { status: 400 })
    }

    const sliced = images.slice(0, 10)

    const parts: Array<{ inlineData: { mimeType: string; data: string } } | { text: string }> = [
      ...sliced.map(base64 => ({
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64.replace(/^data:image\/\w+;base64,/, ''),
        },
      })),
      { text: PRODUCT_ANALYSIS_PROMPT },
    ]

    const model = genAI.getGenerativeModel({ model: MODEL })

    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
    })

    const response = result.response
    const raw = response.text?.() ?? ''

    let analysisResult: AnalysisResult
    try {
      analysisResult = JSON.parse(raw)
    } catch {
      const match = raw.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('IA não retornou JSON válido')
      analysisResult = JSON.parse(match[0])
    }

    return NextResponse.json(analysisResult)
  } catch (error) {
    console.error('[/api/produtos/analyze]', error)
    return NextResponse.json({ error: 'Erro na análise' }, { status: 500 })
  }
}
