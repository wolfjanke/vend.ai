import { NextRequest, NextResponse } from 'next/server'
import { viChatResponse } from '@/lib/gemini'
import { buildViSystemPrompt, type AssistantTone } from '@/lib/vi-prompt'
import type { ViMessage, StoreContext, StoreSettings } from '@/types'
import { logServerError } from '@/lib/logger'
import { sql } from '@/lib/db'
import { getActiveProductsForVi } from '@/lib/store-public-data'
import { checkRateLimit, clientIp } from '@/lib/rate-limit'
import {
  checkViLimit,
  checkViDailyLimit,
  incrementViMessage,
  incrementViDailyCount,
  viIpLimit,
  VI_WHATSAPP_REDIRECT_MESSAGE,
  buildWhatsAppRedirectUrl,
  viModelForPlan,
  viStreamsForPlan,
} from '@/lib/vi-limits'
import type { PlanSlug } from '@/lib/plans'

export { dynamic } from '@/lib/route-dynamic'

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req)
    const { limit, windowMs } = viIpLimit()
    if (!(await checkRateLimit(`vi:ip:${ip}`, limit, windowMs))) {
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

    if (!process.env.GEMINI_API_KEY?.trim()) {
      return NextResponse.json({ error: 'Assistente indisponível no momento.' }, { status: 503 })
    }

    const storeRows = await sql`
      SELECT
        id, plan, whatsapp, name, slug, settings_json,
        assistant_name, assistant_welcome_message, assistant_tone, assistant_gender
      FROM stores
      WHERE slug = ${slug}
      LIMIT 1
    `
    const store = storeRows[0]
    if (!store) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })
    }

    const storeId = String(store.id)
    const plan = (store.plan ?? 'free') as PlanSlug
    const whatsapp = String(storeContext.whatsapp ?? store.whatsapp ?? '')
    const settings = (store.settings_json as StoreSettings) ?? {}

    const dbProducts = await getActiveProductsForVi(storeId)

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://vendai.club'
    const assistantName =
      String(store.assistant_name ?? '').trim() || 'Vi'

    const systemPrompt = buildViSystemPrompt(
      {
        name:            String(store.name),
        assistantName,
        whatsapp,
        storeSlug:       String(store.slug),
        baseUrl,
        plan,
        paymentMethods:  settings.pagamentoInfo,
        deliveryInfo:    settings.freteInfo,
        assistantTone:   (store.assistant_tone as AssistantTone) ?? 'friendly',
        assistantGender: (store.assistant_gender as import('@/lib/assistant-gender').AssistantGender) ?? 'feminine',
      },
      dbProducts,
      settings,
    )

    const dailyOk = await checkViDailyLimit(storeId)
    if (!dailyOk) {
      return NextResponse.json({
        redirectWhatsApp: true,
        message:          VI_WHATSAPP_REDIRECT_MESSAGE,
        whatsappUrl:      buildWhatsAppRedirectUrl(whatsapp),
      })
    }

    const viCheck = await checkViLimit(storeId)
    if (!viCheck.allowed && viCheck.redirect) {
      return NextResponse.json({
        redirectWhatsApp: true,
        message:          VI_WHATSAPP_REDIRECT_MESSAGE,
        whatsappUrl:      buildWhatsAppRedirectUrl(viCheck.whatsapp || whatsapp),
      })
    }

    if (!viCheck.allowed) {
      return NextResponse.json({ error: 'Indisponível no momento.' }, { status: 429 })
    }

    const model = viModelForPlan(plan)
    const stream = viStreamsForPlan(plan)

    const result = await viChatResponse({
      messages,
      systemPrompt,
      model,
      stream,
    })

    await incrementViMessage(storeId, viCheck.isOverage)
    await incrementViDailyCount(storeId)

    if (result instanceof Response) return result

    const text = typeof result === 'string' ? result.trim() : ''
    if (!text) {
      return NextResponse.json({ error: 'A assistente não conseguiu responder. Tente de novo.' }, { status: 502 })
    }

    return NextResponse.json({ text })
  } catch (error) {
    logServerError('[/api/vi]', error)
    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('429') || msg.toLowerCase().includes('quota')) {
      return NextResponse.json(
        { error: 'Muitas consultas à IA agora. Aguarde um minuto e tente de novo.' },
        { status: 429 },
      )
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
