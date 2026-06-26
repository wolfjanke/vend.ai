import { sendEmail } from './index'
import { baseTemplate } from './templates/base'
import { BRAND } from '@/lib/brand'

export async function sendPasswordChangedEmail(to: string) {
  const support = BRAND.supportEmail
  const content = `
    <p style="margin:0 0 16px;font-size:15px;color:#333333;">Olá,</p>
    <p style="margin:0 0 16px;font-size:15px;color:#333333;">
      A senha da sua conta vendai.club foi alterada com sucesso.
    </p>
    <p style="margin:0;font-size:13px;color:#888888;">
      Se você não fez essa alteração, entre em contato imediatamente em
      <a href="mailto:${support}" style="color:#7B6EFF;">${support}</a>.
    </p>
  `

  return sendEmail({
    to,
    subject: 'Senha alterada — vendai.club',
    html: baseTemplate(content, 'Sua senha vendai.club foi alterada'),
  })
}
