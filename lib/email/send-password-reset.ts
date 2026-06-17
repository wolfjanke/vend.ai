import { sendEmail } from './index'
import { baseTemplate } from './templates/base'

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const content = `
    <p style="margin:0 0 16px;font-size:15px;color:#333333;">Olá,</p>
    <p style="margin:0 0 16px;font-size:15px;color:#333333;">
      Recebemos um pedido para redefinir a senha da sua conta vendai.club.
    </p>
    <p style="margin:0 0 24px;text-align:center;">
      <a href="${resetUrl}"
         style="display:inline-block;background:#7B6EFF;color:#FFFFFF;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none;">
        Criar nova senha
      </a>
    </p>
    <p style="margin:0;font-size:13px;color:#888888;">
      O link expira em 1 hora. Se você não pediu isso, ignore este e-mail.
    </p>
  `

  await sendEmail({
    to,
    subject: 'Redefinir senha — vendai.club',
    html: baseTemplate(content, 'Redefinir sua senha vendai.club'),
  })
}
