import { NextRequest, NextResponse } from 'next/server'
import { genAI, MODEL, buildViSystemPrompt } from '@/lib/gemini'
import type { ViMessage, StoreContext, StoreSettings } from '@/types'
import { logServerError } from '@/lib/logger'
import { sql } from '@/lib/db'
import { checkRateLimit, clientIp } from '@/lib/rate-limit'
import { checkAndIncrementViUsage, viIpLimit } from '@/lib/vi-limits'
import type { PlanSlug } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req)
    const { limit, windowMs } = viIpLimit()
    if (!checkRateLimit(`vi:ip:${ip}`, limit, windowMs)) {
      return NextResponse.json(
        { error: 'Muitas mensagens em pouco tempo. Aguarde um minuto.' },
        { status: 429 },
      )
    }

    const body = await req.json() as {
      messages?: ViMessage[]
      storeContext?: StoreContext
    }

    const messages = body.messages
    const storeContext = body.storeContext
    const slug = storeContext?.storeSlug?.trim()

    if (!messages?.length || !storeContext?.name) {
      return NextResponse.json({ error: 'messages required' }, { status: 400 })
    }

    if (!slug) {
      return NextResponse.json({ error: 'Loja inválida' }, { status: 400 })
    }

    const storeRows = await sql`
      SELECT id, plan, settings_json FROM stores WHERE slug = ${slug} LIMIT 1
    `
    const store = storeRows[0]
    if (!store) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })
    }

    const plan = (store.plan ?? 'free') as PlanSlug
    const settings = (store.settings_json as StoreSettings) ?? {}
    const usage = await checkAndIncrementViUsage(String(store.id), plan, settings)
    if (!usage.allowed) {
      const msg =
        usage.reason === 'plan'
          ? 'A assistente Vi não está disponível neste plano da loja.'
          : 'Limite de mensagens da Vi atingido. Tente mais tarde ou fale pelo WhatsApp.'
      return NextResponse.json({ error: msg }, { status: 429 })
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
    logServerError('[/api/vi]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
