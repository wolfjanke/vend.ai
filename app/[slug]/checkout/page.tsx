import { redirect, notFound } from 'next/navigation'
import { sql } from '@/lib/db'
import type { PlanSlug, AsaasOnboardingStatus } from '@/types'
import CheckoutWrapper from '@/components/loja/checkout/CheckoutWrapper'

interface Props {
  params: { slug: string }
}

export default async function CheckoutPage({ params }: Props) {
  const { slug } = params

  const rows = await sql`
    SELECT
      id, slug, name, plan,
      asaas_onboarding_status,
      asaas_wallet_id
    FROM stores
    WHERE slug = ${slug}
    LIMIT 1
  `

  const store = rows[0]
  if (!store) notFound()

  const onboardingStatus = store.asaas_onboarding_status as AsaasOnboardingStatus | null

  if (onboardingStatus !== 'APPROVED' || !store.asaas_wallet_id) {
    redirect(`/${slug}`)
  }

  const plan = (store.plan ?? 'free') as PlanSlug

  return (
    <CheckoutWrapper
      storeSlug={slug}
      storeName={store.name as string}
      plan={plan}
    />
  )
}
