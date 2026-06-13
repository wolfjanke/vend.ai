import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { storeSettingsPatchSchema } from '@/lib/validations'
import { requireSession } from '@/lib/require-session'
import { logServerError } from '@/lib/logger'
import type { PlanSlug } from '@/lib/plans'
import { canUseAssistantFeature } from '@/lib/plans'
import { normalizeLogoSize } from '@/lib/store-logo'
import { normalizeAssistantGender } from '@/lib/assistant-gender'
export { dynamic } from '@/lib/route-dynamic'


function emptyToNull(s: string | undefined | null): string | null {
  if (s == null || String(s).trim() === '') return null
  return String(s).trim()
}

export async function PATCH(req: NextRequest) {
  try {
    const { session, unauthorized } = await requireSession()
    if (!session) return unauthorized!

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const parsed = storeSettingsPatchSchema.safeParse(body)
    if (!parsed.success) {
      const msg = parsed.error.flatten().fieldErrors
      const first = Object.values(msg).flat()[0] ?? 'Dados inválidos'
      return NextResponse.json({ error: first }, { status: 400 })
    }

    const {
      name,
      tagline,
      whatsapp,
      logo_url,
      freteInfo,
      pagamentoInfo,
      pixDiscountPercent,
      couponRules,
      bannerMessages,
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      uf,
      genderFocus,
      ageGroup,
      checkoutChannels,
      deliveryZones,
      freeShippingMin,
      installmentsMaxNoInterest,
      viDailyLimit,
      assistant_name,
      assistant_welcome_message,
      assistant_tone,
      assistant_gender,
      logoSize,
    } = parsed.data

    const storeRows = await sql`
      SELECT settings_json, plan, tagline, assistant_name, assistant_welcome_message, assistant_tone, assistant_gender, logo_url, theme_logo_url
      FROM stores WHERE id = ${session.storeId} LIMIT 1
    `
    const plan = (storeRows[0]?.plan ?? 'free') as PlanSlug

    if (assistant_name !== undefined && !canUseAssistantFeature(plan, 'customName')) {
      return NextResponse.json(
        { error: 'Personalize o nome da assistente a partir do plano Starter.' },
        { status: 403 },
      )
    }
    if (assistant_welcome_message !== undefined && !canUseAssistantFeature(plan, 'customWelcome')) {
      return NextResponse.json(
        { error: 'Mensagem de boas-vindas disponível a partir do plano Pro.' },
        { status: 403 },
      )
    }
    if (assistant_tone !== undefined && !canUseAssistantFeature(plan, 'customTone')) {
      return NextResponse.json(
        { error: 'Tom da assistente disponível a partir do plano Pro.' },
        { status: 403 },
      )
    }

    const assistantName =
      assistant_name !== undefined
        ? assistant_name.trim() || 'Vi'
        : (storeRows[0]?.assistant_name as string) ?? 'Vi'
    const assistantWelcome =
      assistant_welcome_message !== undefined
        ? (assistant_welcome_message?.trim() || null)
        : (storeRows[0]?.assistant_welcome_message as string | null) ?? null
    const assistantToneVal =
      assistant_tone !== undefined
        ? assistant_tone
        : (storeRows[0]?.assistant_tone as string) ?? 'friendly'
    const assistantGenderVal =
      assistant_gender !== undefined
        ? normalizeAssistantGender(assistant_gender)
        : normalizeAssistantGender(storeRows[0]?.assistant_gender)
    const current = (storeRows[0]?.settings_json as Record<string, unknown>) ?? {}
    const merged = {
      ...current,
      ...(freteInfo !== undefined && { freteInfo: freteInfo ?? '' }),
      ...(pagamentoInfo !== undefined && { pagamentoInfo: pagamentoInfo ?? '' }),
      ...(pixDiscountPercent !== undefined && { pixDiscountPercent }),
      ...(couponRules !== undefined && { couponRules: Array.isArray(couponRules) ? couponRules : (current.couponRules ?? []) }),
      ...(bannerMessages !== undefined && {
        bannerMessages: (Array.isArray(bannerMessages) ? bannerMessages : (Array.isArray(current.bannerMessages) ? current.bannerMessages : []))
          .filter((m: { text?: string; startDate?: string; endDate?: string }) => m?.text?.trim())
          .filter((m: { startDate?: string; endDate?: string }) => !m.startDate || !m.endDate || m.startDate <= m.endDate)
          .sort((a: { startDate?: string }, b: { startDate?: string }) => (b.startDate ?? '').localeCompare(a.startDate ?? '')),
      }),
      ...(genderFocus !== undefined && { genderFocus }),
      ...(ageGroup !== undefined && { ageGroup }),
      ...(checkoutChannels !== undefined && { checkoutChannels }),
      ...(deliveryZones !== undefined && { deliveryZones }),
      ...(freeShippingMin !== undefined && { freeShippingMin }),
      ...(installmentsMaxNoInterest !== undefined && { installmentsMaxNoInterest }),
      ...(logoSize !== undefined && { logoSize: normalizeLogoSize(logoSize) }),
    }

    const existingLogo = (storeRows[0]?.logo_url as string | null) ?? null
    const logo =
      logo_url === undefined
        ? existingLogo
        : logo_url === '' || logo_url == null
          ? null
          : logo_url
    const themeLogo =
      logo_url !== undefined
        ? logo
        : ((storeRows[0]?.theme_logo_url as string | null) ?? null)
    const taglineSaved =
      tagline !== undefined
        ? (tagline?.trim() ? tagline.trim().slice(0, 60) : null)
        : (storeRows[0]?.tagline as string | null) ?? null

    if (viDailyLimit !== undefined) {
      await sql`
        UPDATE stores SET
          name = ${name},
          tagline = ${taglineSaved},
          whatsapp = ${whatsapp},
          logo_url = ${logo},
          theme_logo_url = ${themeLogo},
          cep = ${emptyToNull(cep)},
          logradouro = ${emptyToNull(logradouro)},
          numero = ${emptyToNull(numero)},
          complemento = ${emptyToNull(complemento)},
          bairro = ${emptyToNull(bairro)},
          cidade = ${emptyToNull(cidade)},
          uf = ${emptyToNull(uf?.toUpperCase())},
          settings_json = ${JSON.stringify(merged)}::jsonb,
          vi_daily_limit = ${viDailyLimit},
          assistant_name = ${assistantName},
          assistant_welcome_message = ${assistantWelcome},
          assistant_tone = ${assistantToneVal},
          assistant_gender = ${assistantGenderVal}
        WHERE id = ${session.storeId}
      `
    } else {
      await sql`
        UPDATE stores SET
          name = ${name},
          tagline = ${taglineSaved},
          whatsapp = ${whatsapp},
          logo_url = ${logo},
          theme_logo_url = ${themeLogo},
          cep = ${emptyToNull(cep)},
          logradouro = ${emptyToNull(logradouro)},
          numero = ${emptyToNull(numero)},
          complemento = ${emptyToNull(complemento)},
          bairro = ${emptyToNull(bairro)},
          cidade = ${emptyToNull(cidade)},
          uf = ${emptyToNull(uf?.toUpperCase())},
          settings_json = ${JSON.stringify(merged)}::jsonb,
          assistant_name = ${assistantName},
          assistant_welcome_message = ${assistantWelcome},
          assistant_tone = ${assistantToneVal},
          assistant_gender = ${assistantGenderVal}
        WHERE id = ${session.storeId}
      `
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    logServerError('[/api/admin/store]', error)
    return NextResponse.json(
      { error: 'Falha de conexão com o banco (Neon). Verifique internet/DATABASE_URL e tente novamente.' },
      { status: 503 }
    )
  }
}
