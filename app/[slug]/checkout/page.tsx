import { redirect, notFound } from 'next/navigation'
import { sql } from '@/lib/db'
import type { PlanSlug, AsaasOnboardingStatus } from '@/types'
import { getCheckoutRates } from '@/lib/checkout-rates'
import { getAsaasEnv } from '@/lib/payments/config'
import CheckoutWrapper from '@/components/loja/checkout/CheckoutWrapper'

interface Props {
  params: { slug: string }
}

export default async function CheckoutPage({ params }: Props) {
  const { slug } = params

  const rows = await sql`
    SELECT
      id, slug, name, plan, logo_url, theme_logo_url,
      asaas_onboarding_status,
      asaas_wallet_id,
      is_demo
    FROM stores
    WHERE slug = ${slug}
    LIMIT 1
  `

  const store = rows[0]
  if (!store) notFound()

  const onboardingStatus = store.asaas_onboarding_status as AsaasOnboardingStatus | null

  if (store.is_demo === true || onboardingStatus !== 'APPROVED' || !store.asaas_wallet_id) {
    redirect(`/${slug}`)
  }

  const plan = (store.plan ?? 'free') as PlanSlug
  const rates = await getCheckoutRates()
  const logo = (store.theme_logo_url ?? store.logo_url) as string | null

  return (
    <CheckoutWrapper
      storeSlug={slug}
      storeName={store.name as string}
      storeLogo={logo}
      plan={plan}
      rates={rates}
      asaasEnv={getAsaasEnv()}
    />
  )
}
