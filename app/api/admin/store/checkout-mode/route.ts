import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sql } from '@/lib/db'
import { requireSession } from '@/lib/require-session'
import type { PlanSlug } from '@/lib/plans'
import { isPlanCheckoutEligible } from '@/lib/plans'
import { isCheckoutEnabledForStore } from '@/lib/checkout-enabled'
import {
  checkoutChannelsFromMode,
  checkoutModeIncludesSite,
  normalizeCheckoutMode,
  type CheckoutMode,
} from '@/lib/checkout-availability'
export { dynamic } from '@/lib/route-dynamic'

const bodySchema = z.object({
  checkout_mode: z.enum(['whatsapp_only', 'whatsapp_and_checkout', 'checkout_only']),
})

export async function PUT(req: NextRequest) {
  const { session, unauthorized } = await requireSession()
  if (!session) return unauthorized!

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Modo de recebimento inválido.' }, { status: 400 })
  }

  const mode = parsed.data.checkout_mode as CheckoutMode

  const rows = await sql`
    SELECT plan, settings_json, asaas_onboarding_status, asaas_wallet_id, is_demo
    FROM stores
    WHERE id = ${session.storeId}
    LIMIT 1
  `
  const store = rows[0] as {
    plan: string | null
    settings_json: Record<string, unknown> | null
    asaas_onboarding_status: string | null
    asaas_wallet_id: string | null
    is_demo: boolean | null
  } | undefined

  if (!store) {
    return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })
  }

  const plan = (store.plan ?? 'free') as PlanSlug

  if (mode !== 'whatsapp_only' && !isPlanCheckoutEligible(plan)) {
    return NextResponse.json(
      { error: 'Checkout disponível a partir do plano Starter.' },
      { status: 403 },
    )
  }

  if (checkoutModeIncludesSite(mode)) {
    const eligible = isCheckoutEnabledForStore({
      plan,
      asaas_onboarding_status: store.asaas_onboarding_status,
      asaas_wallet_id:         store.asaas_wallet_id,
      is_demo:                 store.is_demo,
    })
    if (!eligible) {
      return NextResponse.json(
        { error: 'Configure seu CNPJ e aguarde aprovação para ativar o checkout.' },
        { status: 403 },
      )
    }
  }

  const normalized = normalizeCheckoutMode(mode)
  const channels = checkoutChannelsFromMode(normalized)
  const current = (store.settings_json ?? {}) as Record<string, unknown>
  const merged = {
    ...current,
    checkoutChannels: channels,
  }

  await sql`
    UPDATE stores
    SET
      checkout_mode = ${normalized},
      settings_json = ${JSON.stringify(merged)}::jsonb
    WHERE id = ${session.storeId}
  `

  return NextResponse.json({ ok: true, checkout_mode: normalized })
}
