import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { storeSettingsPatchSchema } from '@/lib/validations'
import { requireSession } from '@/lib/require-session'
import { logServerError } from '@/lib/logger'

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
    } = parsed.data

    const storeRows = await sql`SELECT settings_json FROM stores WHERE id = ${session.storeId} LIMIT 1`
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
    }

    const logo = logo_url === '' || logo_url == null ? null : logo_url

    await sql`
      UPDATE stores SET
        name = ${name},
        whatsapp = ${whatsapp},
        logo_url = ${logo},
        cep = ${emptyToNull(cep)},
        logradouro = ${emptyToNull(logradouro)},
        numero = ${emptyToNull(numero)},
        complemento = ${emptyToNull(complemento)},
        bairro = ${emptyToNull(bairro)},
        cidade = ${emptyToNull(cidade)},
        uf = ${emptyToNull(uf?.toUpperCase())},
        settings_json = ${JSON.stringify(merged)}::jsonb
      WHERE id = ${session.storeId}
    `
    return NextResponse.json({ ok: true })
  } catch (error) {
    logServerError('[/api/admin/store]', error)
    return NextResponse.json(
      { error: 'Falha de conexão com o banco (Neon). Verifique internet/DATABASE_URL e tente novamente.' },
      { status: 503 }
    )
  }
}
