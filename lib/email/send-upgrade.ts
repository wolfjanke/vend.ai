import { sendEmail } from './index'
import { upgradeEmailHtml } from './templates/upgrade'
import { formatPlanPrice, getPlan, PLAN_FEATURE_LINES, formatBillingCycleLabel, type PlanSlug, type BillingCycle } from '@/lib/plans'
import type { SubscriptionStatus } from '@/types'

function formatChargeDate(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

export async function sendUpgradeEmail(params: {
  ownerName:          string
  ownerEmail:         string
  storeName:          string
  oldPlan:            string
  newPlan:            string
  billingCycle:       BillingCycle
  subscriptionStatus: SubscriptionStatus | null
  trialDaysRemaining: number | null
  nextChargeAt:       string | null
  trialDays:          number
}) {
  const slug = (params.newPlan in PLAN_FEATURE_LINES ? params.newPlan : 'starter') as PlanSlug
  const planDef = getPlan(slug)
  const onTrial = params.subscriptionStatus === 'TRIAL'
  const firstChargeLabel = formatChargeDate(params.nextChargeAt)

  const html = upgradeEmailHtml({
    ownerName:          params.ownerName,
    storeName:          params.storeName,
    newPlanLabel:       planDef.name,
    newPlanPrice:       `${formatPlanPrice(planDef.price)}/mês`,
    billingCycleLabel:  formatBillingCycleLabel(params.billingCycle),
    onTrial,
    trialDaysRemaining: params.trialDaysRemaining,
    trialDays:          params.trialDays,
    firstChargeDate:    firstChargeLabel,
    newFeatures:        PLAN_FEATURE_LINES[slug] ?? [],
  })

  return sendEmail({
    to:      params.ownerEmail,
    subject: onTrial
      ? `Plano ${planDef.name} ativo — 1ª cobrança em ${firstChargeLabel ?? 'breve'}`
      : `Seu plano foi atualizado para ${planDef.name}!`,
    html,
  })
}
