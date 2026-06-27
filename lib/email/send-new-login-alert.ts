import { sendEmail } from './index'
import { baseTemplate } from './templates/base'
import { BRAND } from '@/lib/brand'

export async function sendNewLoginAlertEmail(
  to: string,
  details: { ip: string; previousIp: string; at: string },
) {
  const support = BRAND.supportEmail
  const content = `
    <p style="margin:0 0 16px;font-size:15px;color:#333333;">Olá,</p>
    <p style="margin:0 0 16px;font-size:15px;color:#333333;">
      Detectamos um login na sua conta vendai.club a partir de um endereço IP diferente do habitual.
    </p>
    <ul style="margin:0 0 16px;padding-left:20px;font-size:14px;color:#333333;">
      <li>Horário: ${details.at}</li>
      <li>IP deste acesso: ${details.ip}</li>
      <li>IP anterior: ${details.previousIp}</li>
    </ul>
    <p style="margin:0;font-size:13px;color:#888888;">
      Se foi você, ignore este e-mail. Se não reconhece este acesso, altere sua senha e entre em contato em
      <a href="mailto:${support}" style="color:#7B6EFF;">${support}</a>.
    </p>
  `

  return sendEmail({
    to,
    subject: 'Novo login na sua conta — vendai.club',
    html: baseTemplate(content, 'Alerta de login vendai.club'),
  })
}
