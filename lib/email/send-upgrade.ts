import { sendEmail } from './index'
import { upgradeEmailHtml } from './templates/upgrade'

const PLAN_FEATURES: Record<string, string[]> = {
  starter: [
    'Até 25 produtos no catálogo',
    '5.000 mensagens da Vi por mês',
    'Personalização do nome da assistente',
    'Análise de foto com IA (50 fotos/mês)',
    '6 temas de identidade visual',
  ],
  pro: [
    'Até 200 produtos no catálogo',
    '15.000 mensagens da Vi por mês',
    'Mensagem de boas-vindas personalizada',
    'Tom da assistente configurável',
    'Análise de foto com IA (200 fotos/mês)',
    'Efeito shimmer nos cards (opcional)',
    'Recuperação de carrinho abandonado',
    'Sugestão de tema por IA',
  ],
  loja: [
    'Produtos ilimitados',
    '40.000 mensagens da Vi por mês',
    'Mini PDV para vendas presenciais',
    'Análise de foto com IA ilimitada',
    'Métricas avançadas',
    'Suporte prioritário',
  ],
  enterprise: [
    'Tudo do plano Loja',
    '60.000 mensagens da Vi por mês',
    'Suporte prioritário e atendimento dedicado',
  ],
}

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter',
  pro: 'Pro',
  loja: 'Loja',
  enterprise: 'Enterprise',
}

const PLAN_PRICES: Record<string, string> = {
  starter: 'R$49,90/mês',
  pro: 'R$99,90/mês',
  loja: 'R$199,90/mês',
  enterprise: 'R$399,90/mês',
}

export async function sendUpgradeEmail(params: {
  ownerName: string
  ownerEmail: string
  storeName: string
  oldPlan: string
  newPlan: string
  renewalDay: number
}) {
  const html = upgradeEmailHtml({
    ownerName: params.ownerName,
    storeName: params.storeName,
    newPlanLabel: PLAN_LABELS[params.newPlan] ?? params.newPlan,
    newPlanPrice: PLAN_PRICES[params.newPlan] ?? '',
    renewalDay: params.renewalDay,
    newFeatures: PLAN_FEATURES[params.newPlan] ?? [],
  })

  return sendEmail({
    to: params.ownerEmail,
    subject: `Seu plano foi atualizado para ${PLAN_LABELS[params.newPlan] ?? params.newPlan}! 🚀`,
    html,
  })
}
