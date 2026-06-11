import { sql } from '@/lib/db'
import type { PlanSlug } from '@/lib/plans'
import { resolveCheckoutChannelsFromStore } from '@/lib/checkout-availability'

export interface CheckoutAvailability {
  siteEnabled:     boolean
  whatsappEnabled: boolean
}

/** Canais de finalização na vitrine (plano + CNPJ + checkout_mode). */
export async function resolveCheckoutAvailability(slug: string): Promise<CheckoutAvailability> {
  const rows = await sql`
    SELECT
      plan,
      asaas_onboarding_status,
      asaas_wallet_id,
      is_demo,
      checkout_mode
    FROM stores
    WHERE slug = ${slug}
    LIMIT 1
  `

  const row = rows[0] as {
    plan: string | null
    asaas_onboarding_status: string | null
    asaas_wallet_id: string | null
    is_demo: boolean | null
    checkout_mode: string | null
  } | undefined

  if (!row) return { siteEnabled: false, whatsappEnabled: true }

  return resolveCheckoutChannelsFromStore({
    plan:                    (row.plan ?? 'free') as PlanSlug,
    asaas_onboarding_status: row.asaas_onboarding_status,
    asaas_wallet_id:         row.asaas_wallet_id,
    is_demo:                 row.is_demo,
    checkout_mode:           row.checkout_mode,
  })
}

/** @deprecated Use resolveCheckoutAvailability().siteEnabled */
export async function resolveCheckoutSiteEnabled(_slug: string, _settings?: unknown): Promise<boolean> {
  const { siteEnabled } = await resolveCheckoutAvailability(_slug)
  return siteEnabled
}
