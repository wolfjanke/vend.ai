import { NextRequest, NextResponse } from 'next/server'
import { anthropic, buildViSystemPrompt } from '@/lib/anthropic'
import type { ViMessage, StoreContext } from '@/types'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { messages, storeContext }: { messages: ViMessage[]; storeContext: StoreContext } = await req.json()

    if (!messages?.length) {
      return NextResponse.json({ error: 'messages required' }, { status: 400 })
    }

    const stream = await anthropic.messages.stream({
      model:      'claude-sonnet-4-6',
      max_tokens: 512,
      system:     buildViSystemPrompt(storeContext),
      messages:   messages.map(m => ({ role: m.role, content: m.content })),
    })

    const encoder = new TextEncoder()

    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
        controller.close()
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
