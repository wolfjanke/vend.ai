import { NextRequest, NextResponse } from 'next/server'
import { genAI, MODEL, buildViSystemPrompt } from '@/lib/gemini'
import type { ViMessage, StoreContext } from '@/types'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { messages, storeContext }: { messages: ViMessage[]; storeContext: StoreContext } = await req.json()

    if (!messages?.length) {
      return NextResponse.json({ error: 'messages required' }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction: buildViSystemPrompt(storeContext),
    })

    const contents = messages.map(m => ({
      role: m.role === 'user' ? ('user' as const) : ('model' as const),
      parts: [{ text: m.content }],
    }))

    const result = await model.generateContentStream({ contents })

    const encoder = new TextEncoder()

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text =
              (typeof (chunk as { text?: () => string }).text === 'function'
                ? (chunk as { text: () => string }).text()
                : (chunk as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }).candidates?.[0]?.content?.parts?.[0]?.text) ?? ''
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
  } catch (error) {
    console.error('[/api/vi]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
