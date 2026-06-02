import { sendEmail } from './index'
import { welcomeEmailHtml } from './templates/welcome'
import { generateTermsPdf } from './pdf/terms-pdf'

const PLAN_LABELS: Record<string, string> = {
  free: 'Grátis — R$0,00/mês',
  starter: 'Starter — R$49,90/mês',
  pro: 'Pro — R$99,90/mês',
  loja: 'Loja — R$199,90/mês',
  enterprise: 'Enterprise — R$399,90/mês',
}

export async function sendWelcomeEmail(store: {
  ownerName: string
  ownerEmail: string
  storeName: string
  storeSlug: string
  plan: string
  trialDays?: number
  assistantName: string
  acceptedAt: string
  acceptedIp: string
  termsVersion: string
}) {
  const pdfBuffer = await generateTermsPdf({
    ownerName: store.ownerName,
    email: store.ownerEmail,
    storeName: store.storeName,
    storeSlug: store.storeSlug,
    plan: store.plan,
    planPrice: PLAN_LABELS[store.plan] ?? store.plan,
    acceptedAt: store.acceptedAt,
    acceptedIp: store.acceptedIp,
    termsVersion: store.termsVersion,
  })

  const html = welcomeEmailHtml({
    ownerName: store.ownerName,
    storeName: store.storeName,
    storeSlug: store.storeSlug,
    plan: store.plan,
    planLabel: PLAN_LABELS[store.plan] ?? store.plan,
    trialDays: store.trialDays,
    assistantName: store.assistantName,
  })

  return sendEmail({
    to: store.ownerEmail,
    subject: `Bem-vindo ao vend.ai — ${store.storeName} está no ar! 🎉`,
    html,
    attachments: [
      {
        filename: `contrato-vend-ai-${store.storeSlug}.pdf`,
        content: pdfBuffer,
      },
    ],
  })
}
