import { sendEmail } from './index'
import { upgradeEmailHtml } from './templates/upgrade'
import { formatPlanLabel, formatPlanPrice, getPlan, PLAN_FEATURE_LINES, type PlanSlug } from '@/lib/plans'

export async function sendUpgradeEmail(params: {
  ownerName: string
  ownerEmail: string
  storeName: string
  oldPlan: string
  newPlan: string
  renewalDay: number
}) {
  const slug = (params.newPlan in PLAN_FEATURE_LINES ? params.newPlan : 'starter') as PlanSlug
  const planDef = getPlan(slug)

  const html = upgradeEmailHtml({
    ownerName: params.ownerName,
    storeName: params.storeName,
    newPlanLabel: planDef.name,
    newPlanPrice: `${formatPlanPrice(planDef.price)}/mês`,
    renewalDay: params.renewalDay,
    newFeatures: PLAN_FEATURE_LINES[slug] ?? [],
  })

  return sendEmail({
    to: params.ownerEmail,
    subject: `Seu plano foi atualizado para ${planDef.name}!`,
    html,
  })
}
