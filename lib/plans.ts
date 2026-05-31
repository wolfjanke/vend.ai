/** Definição central de planos — preços em centavos (BRL). */
export type PlanSlug = 'free' | 'starter' | 'pro' | 'loja' | 'enterprise'

export type PlanOverage = {
  per:   number
  price: number
}

export type PlanDefinition = {
  name:                 string
  price:                number
  productLimit:         number | null
  viMessagesLimit:      number
  photoAnalysisLimit:   number | null
  overage:              PlanOverage | null
}

export const PLANS: Record<PlanSlug, PlanDefinition> = {
  free: {
    name:               'Grátis',
    price:              0,
    productLimit:       10,
    viMessagesLimit:    1_000,
    photoAnalysisLimit: 10,
    overage:            null,
  },
  starter: {
    name:               'Starter',
    price:              4_990,
    productLimit:       25,
    viMessagesLimit:    5_000,
    photoAnalysisLimit: 50,
    overage:            { per: 1_000, price: 200 },
  },
  pro: {
    name:               'Pro',
    price:              9_990,
    productLimit:       200,
    viMessagesLimit:    15_000,
    photoAnalysisLimit: 200,
    overage:            { per: 1_000, price: 150 },
  },
  loja: {
    name:               'Loja',
    price:              19_990,
    productLimit:       null,
    viMessagesLimit:    40_000,
    photoAnalysisLimit: null,
    overage:            { per: 1_000, price: 100 },
  },
  enterprise: {
    name:               'Enterprise',
    price:              39_990,
    productLimit:       null,
    viMessagesLimit:    60_000,
    photoAnalysisLimit: null,
    overage:            { per: 1_000, price: 80 },
  },
}

export const PLAN_SLUGS = Object.keys(PLANS) as PlanSlug[]

export const PLAN_PRODUCT_LIMITS: Record<PlanSlug, number | null> = Object.fromEntries(
  PLAN_SLUGS.map(slug => [slug, PLANS[slug].productLimit]),
) as Record<PlanSlug, number | null>

export function getPlan(slug: PlanSlug): PlanDefinition {
  return PLANS[slug] ?? PLANS.free
}

export function formatPlanPrice(cents: number): string {
  if (cents === 0) return 'R$ 0'
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`
}

export function formatOverageLine(slug: PlanSlug): string | null {
  const o = PLANS[slug].overage
  if (!o) return null
  const reais = (o.price / 100).toFixed(2).replace('.', ',')
  return `+ R$${reais} por ${o.per.toLocaleString('pt-BR')} mensagens extras`
}

/** Planos pagos com Vi completa (streaming, gatilhos). */
export function isPaidViPlan(plan: PlanSlug): boolean {
  return plan !== 'free'
}
