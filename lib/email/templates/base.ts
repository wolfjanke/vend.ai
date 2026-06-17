import { COMPANY, companyCityShort } from '@/lib/company'
import { BRAND } from '@/lib/brand'
import { EMAIL_CONFIG } from '../index'

export function baseTemplate(content: string, previewText: string): string {
  const baseUrl = EMAIL_CONFIG.baseUrl
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>vendai.club</title>
</head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:'DM Sans',Arial,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;">${previewText}</span>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <tr>
            <td style="background:#050814;border-radius:16px 16px 0 0;padding:28px 40px;text-align:center;">
              <div style="display:inline-block;font-family:Arial,Helvetica,sans-serif;line-height:1;position:relative;">
                <span style="display:block;font-size:32px;font-weight:800;letter-spacing:-0.5px;background:linear-gradient(90deg,#5C7BFF,#41A8FF,#22D9C3);-webkit-background-clip:text;color:#41A8FF;">vendai</span>
                <span style="position:absolute;right:-2%;bottom:-5%;font-size:13px;font-weight:700;background:linear-gradient(90deg,#41A8FF,#22D9C3);-webkit-background-clip:text;color:#22D9C3;">.club</span>
              </div>
            </td>
          </tr>

          <tr>
            <td style="background:#FFFFFF;padding:40px;border-radius:0 0 16px 16px;">
              ${content}
            </td>
          </tr>

          <tr>
            <td style="padding:24px 0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#888888;line-height:1.6;">
                ${COMPANY.name}<br>
                CNPJ ${COMPANY.cnpj} · ${companyCityShort()}<br>
                <a href="${baseUrl}/termos" style="color:#7B6EFF;text-decoration:none;">Termos de Uso</a>
                &nbsp;·&nbsp;
                <a href="${baseUrl}/privacidade" style="color:#7B6EFF;text-decoration:none;">Privacidade</a>
                &nbsp;·&nbsp;
                <a href="mailto:${EMAIL_CONFIG.replyTo}" style="color:#7B6EFF;text-decoration:none;">Contato</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}
