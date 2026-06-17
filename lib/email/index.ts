import { Resend } from 'resend'
import { logServerError } from '@/lib/logger'
import { BRAND } from '@/lib/brand'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM ?? `${BRAND.displayName} <${BRAND.supportEmail}>`,  replyTo: process.env.EMAIL_REPLY_TO ?? 'wolfgangjanke1@gmail.com',
  baseUrl: (process.env.NEXT_PUBLIC_APP_URL ?? 'https://vendai.club').replace(/\/$/, ''),
}

export async function sendEmail({
  to,
  subject,
  html,
  attachments,
}: {
  to: string
  subject: string
  html: string
  attachments?: { filename: string; content: Buffer }[]
}) {
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY ausente — e-mail não enviado.')
    return { success: false as const, error: 'RESEND_API_KEY missing' }
  }

  try {
    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      replyTo: EMAIL_CONFIG.replyTo,
      to,
      subject,
      html,
      attachments: attachments?.map(a => ({
        filename: a.filename,
        content: a.content,
      })),
    })

    if (result.error) {
      logServerError('[Email] Resend error', result.error)
      return { success: false as const, error: result.error }
    }

    return { success: true as const, id: result.data?.id }
  } catch (error) {
    logServerError('[Email] Erro ao enviar', error)
    return { success: false as const, error }
  }
}
