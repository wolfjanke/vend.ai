import { sql } from '@/lib/db'
import type { StoreSettings } from '@/types'

/** Indica se o checkout integrado está disponível na vitrine (sem expor campos Asaas). */
export async function resolveCheckoutSiteEnabled(
  slug: string,
  settings?: StoreSettings,
): Promise<boolean> {
  const rows = await sql`
    SELECT
      asaas_onboarding_status,
      asaas_wallet_id,
      is_demo
    FROM stores
    WHERE slug = ${slug}
    LIMIT 1
  `

  const row = rows[0] as {
    asaas_onboarding_status: string | null
    asaas_wallet_id: string | null
    is_demo: boolean | null
  } | undefined

  if (!row || row.is_demo === true) return false

  const siteEnabled = settings?.checkoutChannels?.siteEnabled === true
  if (!siteEnabled) return false

  return row.asaas_onboarding_status === 'APPROVED' && !!row.asaas_wallet_id
}
