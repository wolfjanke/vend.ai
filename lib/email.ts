import { Resend } from 'resend'

import { logServerError } from '@/lib/logger'

const from = process.env.EMAIL_FROM ?? 'vend.ai <onboarding@resend.dev>'

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn('[email] RESEND_API_KEY ausente — e-mail de redefinição não enviado.')
    return
  }

  const resend = new Resend(key)
  const { error } = await resend.emails.send({
    from,
    to: [to],
    subject: 'Redefinir senha — vend.ai',
    html: `
      <p>Olá,</p>
      <p>Recebemos um pedido para redefinir a senha da sua conta vend.ai.</p>
      <p><a href="${resetUrl}">Clique aqui para criar uma nova senha</a></p>
      <p>O link expira em 1 hora. Se você não pediu isso, ignore este e-mail.</p>
    `,
  })
  if (error) logServerError('[email] Resend', error)
}
