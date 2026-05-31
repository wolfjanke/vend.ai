import { NextRequest, NextResponse } from 'next/server'
import { buildViSystemPrompt, viChatResponse } from '@/lib/gemini'
import type { ViMessage, StoreContext } from '@/types'
import { logServerError } from '@/lib/logger'
import { sql } from '@/lib/db'
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
      SELECT id, plan, whatsapp FROM stores WHERE slug = ${slug} LIMIT 1
    `
    const store = storeRows[0]
    if (!store) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })
    }

    const storeId = String(store.id)
    const plan = (store.plan ?? 'free') as PlanSlug
    const whatsapp = String(storeContext.whatsapp ?? store.whatsapp ?? '')

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

    await incrementViMessage(storeId, viCheck.isOverage)
    await incrementViDailyCount(storeId)

    const systemPrompt = buildViSystemPrompt(storeContext)
    const model = viModelForPlan(plan)
    const stream = viStreamsForPlan(plan)

    const result = await viChatResponse({
      messages,
      systemPrompt,
      model,
      stream,
    })

    if (result instanceof Response) return result

    return NextResponse.json({ text: result })
  } catch (error) {
    logServerError('[/api/vi]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
