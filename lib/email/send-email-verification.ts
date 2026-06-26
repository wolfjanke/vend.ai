import { sendEmail } from './index'
import { baseTemplate } from './templates/base'

export async function sendEmailVerificationEmail(to: string, verifyUrl: string) {
  const content = `
    <p style="margin:0 0 16px;font-size:15px;color:#333333;">Olá,</p>
    <p style="margin:0 0 16px;font-size:15px;color:#333333;">
      Confirme seu e-mail para ativar sua conta e acessar o painel vendai.club.
    </p>
    <p style="margin:0 0 24px;text-align:center;">
      <a href="${verifyUrl}"
         style="display:inline-block;background:#7B6EFF;color:#FFFFFF;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none;">
        Confirmar e-mail
      </a>
    </p>
    <p style="margin:0;font-size:13px;color:#888888;">
      O link expira em 24 horas. Se você não criou esta conta, ignore este e-mail.
    </p>
  `

  return sendEmail({
    to,
    subject: 'Confirme seu e-mail — vendai.club',
    html: baseTemplate(content, 'Confirme seu e-mail vendai.club'),
  })
}
