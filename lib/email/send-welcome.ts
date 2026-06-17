import { sendEmail } from './index'
import { welcomeEmailHtml } from './templates/welcome'
import { generateTermsPdf } from './pdf/terms-pdf'
import { formatPlanLabel } from '@/lib/plans'

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
    planPrice: formatPlanLabel(store.plan),
    acceptedAt: store.acceptedAt,
    acceptedIp: store.acceptedIp,
    termsVersion: store.termsVersion,
  })

  const html = welcomeEmailHtml({
    ownerName: store.ownerName,
    storeName: store.storeName,
    storeSlug: store.storeSlug,
    plan: store.plan,
    planLabel: formatPlanLabel(store.plan),
    trialDays: store.trialDays,
    assistantName: store.assistantName,
  })

  return sendEmail({
    to: store.ownerEmail,
    subject: `Bem-vindo ao vendai.club — ${store.storeName} está no ar!`,
    html,
    attachments: [
      {
        filename: `contrato-vend-ai-${store.storeSlug}.pdf`,
        content: pdfBuffer,
      },
    ],
  })
}
