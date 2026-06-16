/** Definição central de planos — preços em centavos (BRL). */
export type PlanSlug = 'free' | 'starter' | 'pro' | 'loja' | 'enterprise'

export type BillingCycle = 'monthly' | 'quarterly' | 'annual'

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
  /** Checkout integrado disponível neste plano (requer CNPJ aprovado no Asaas). */
  checkoutEnabled:      boolean
}

export const PLANS: Record<PlanSlug, PlanDefinition> = {
  free: {
    name:               'Grátis',
    price:              0,
    productLimit:       10,
    viMessagesLimit:    500,
    photoAnalysisLimit: 0,
    overage:            null,
    checkoutEnabled:    false,
  },
  starter: {
    name:               'Starter',
    price:              3_990,
    productLimit:       50,
    viMessagesLimit:    3_000,
    photoAnalysisLimit: 20,
    overage:            { per: 1_000, price: 200 },
    checkoutEnabled:    false,
  },
  pro: {
    name:               'Pro',
    price:              5_990,
    productLimit:       200,
    viMessagesLimit:    10_000,
    photoAnalysisLimit: null,
    overage:            { per: 1_000, price: 150 },
    checkoutEnabled:    false,
  },
  loja: {
    name:               'Loja',
    price:              9_990,
    productLimit:       null,
    viMessagesLimit:    30_000,
    photoAnalysisLimit: null,
    overage:            { per: 1_000, price: 100 },
    checkoutEnabled:    false,
  },
  enterprise: {
    name:               'Enterprise',
    price:              19_990,
    productLimit:       null,
    viMessagesLimit:    60_000,
    photoAnalysisLimit: null,
    overage:            { per: 1_000, price: 80 },
    checkoutEnabled:    false,
  },
}

export const PLAN_SLUGS = Object.keys(PLANS) as PlanSlug[]

/** Dias de trial gratuito ao assinar (planos pagos). */
export const TRIAL_DAYS_BY_PLAN: Partial<Record<PlanSlug, number>> = {
  starter:    7,
  pro:        14,
  loja:       14,
  enterprise: 30,
}

export const PAID_PLAN_SLUGS: PlanSlug[] = ['starter', 'pro', 'loja', 'enterprise']

export function isPaidPlan(slug: PlanSlug): boolean {
  return PAID_PLAN_SLUGS.includes(slug)
}

export function isPlanCheckoutEligible(plan: string): boolean {
  const slug = (plan in PLANS ? plan : 'free') as PlanSlug
  return PLANS[slug].checkoutEnabled
}

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

/** Label legível para e-mails e PDF: "Starter — R$ 39,90/mês" */
export function formatPlanLabel(slug: PlanSlug | string): string {
  const plan = getPlan((slug in PLANS ? slug : 'free') as PlanSlug)
  if (plan.price === 0) return `${plan.name} — R$ 0,00/mês`
  return `${plan.name} — ${formatPlanPrice(plan.price)}/mês`
}

export function formatOverageLine(slug: PlanSlug): string | null {
  const o = PLANS[slug].overage
  if (!o) return null
  const reais = (o.price / 100).toFixed(2).replace('.', ',')
  return `+ R$${reais} por ${o.per.toLocaleString('pt-BR')} mensagens extras`
}

/** Total cobrado por período no Asaas (centavos). */
export function getChargeAmountCents(slug: PlanSlug, cycle: BillingCycle): number {
  const monthly = PLANS[slug].price
  if (cycle === 'monthly') return monthly
  if (cycle === 'quarterly') return Math.round(monthly * 3 * 0.9)
  return Math.round(monthly * 12 * 0.8)
}

/** Equivalente mensal para exibição nos cards (centavos). */
export function getDisplayMonthlyCents(slug: PlanSlug, cycle: BillingCycle): number {
  const charge = getChargeAmountCents(slug, cycle)
  if (cycle === 'monthly') return charge
  if (cycle === 'quarterly') return Math.round(charge / 3)
  return Math.round(charge / 12)
}

export function getBillingPeriodDays(cycle: BillingCycle): number {
  if (cycle === 'quarterly') return 90
  if (cycle === 'annual') return 365
  return 30
}

export function formatBillingCycleLabel(cycle: BillingCycle): string {
  if (cycle === 'quarterly') return 'Trimestral -10%'
  if (cycle === 'annual') return 'Anual -20%'
  return 'Mensal'
}

export function formatBillingPeriodNoun(cycle: BillingCycle): string {
  if (cycle === 'quarterly') return 'trimestre'
  if (cycle === 'annual') return 'ano'
  return 'mês'
}

/** Centavos por dia (para copy "equivale a R$ X/dia"). */
export function getDailyCentsFromCharge(chargeCents: number, cycle: BillingCycle): number {
  const days = getBillingPeriodDays(cycle)
  return Math.round(chargeCents / days)
}

/** Planos pagos com Vi completa (streaming, gatilhos). */
export function isPaidViPlan(plan: PlanSlug): boolean {
  return plan !== 'free'
}

export function canUsePhotoAnalysis(plan: PlanSlug | string): boolean {
  const slug = (plan in PLANS ? plan : 'free') as PlanSlug
  const limit = PLANS[slug].photoAnalysisLimit
  return limit === null || limit > 0
}

export type AssistantFeature = 'customName' | 'customWelcome' | 'customTone'

export const PLAN_ASSISTANT_FEATURES: Record<
  PlanSlug,
  { customName: boolean; customWelcome: boolean; customTone: boolean }
> = {
  free:       { customName: false, customWelcome: false, customTone: false },
  starter:    { customName: true,  customWelcome: false, customTone: false },
  pro:        { customName: true,  customWelcome: true,  customTone: true  },
  loja:       { customName: true,  customWelcome: true,  customTone: true  },
  enterprise: { customName: true,  customWelcome: true,  customTone: true  },
}

export function canUseAssistantFeature(plan: string, feature: AssistantFeature): boolean {
  const p = (plan in PLAN_ASSISTANT_FEATURES ? plan : 'free') as PlanSlug
  return PLAN_ASSISTANT_FEATURES[p][feature]
}

/** Features honestas por plano (landing e admin). */
export const PLAN_FEATURE_LINES: Record<PlanSlug, string[]> = {
  free: [
    'Até 10 produtos',
    '500 msgs Vi/mês',
    'Pedidos via WhatsApp',
    'Temas de identidade visual',
    'Controle de estoque',
  ],
  starter: [
    'Até 50 produtos',
    '3.000 msgs Vi/mês',
    '20 análises de foto/mês',
    'Links de pagamento na vitrine',
    'IA no cadastro de produtos',
  ],
  pro: [
    'Até 200 produtos',
    '10.000 msgs Vi/mês',
    'Análises de foto ilimitadas',
    'Cupons de desconto',
    'Recuperação de pedidos',
    'Vi completa + streaming',
  ],
  loja: [
    'Produtos ilimitados',
    '30.000 msgs Vi/mês',
    'PDV para loja física',
    'Análises de foto ilimitadas',
    'Vi completa',
  ],
  enterprise: [
    'Produtos ilimitados',
    '60.000 msgs Vi/mês',
    'Suporte prioritário',
    'Vi completa',
    'Atendimento dedicado',
  ],
}
