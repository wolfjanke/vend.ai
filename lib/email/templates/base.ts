import { COMPANY, companyCityShort } from '@/lib/company'
import { BRAND, BRAND_LOGO } from '@/lib/brand'
import { EMAIL_CONFIG } from '../index'

/** Logo PNG para clientes de e-mail (Gmail não renderiza gradiente em texto nem SVG externo). */
function emailLogoHtml(): string {
  const baseUrl = EMAIL_CONFIG.baseUrl
  const src = `${baseUrl}${BRAND_LOGO.wordmarkEmail}`
  return `
              <a href="${baseUrl}" style="text-decoration:none;display:inline-block;line-height:0;">
                <img
                  src="${src}"
                  width="220"
                  height="57"
                  alt="${BRAND.displayName}"
                  style="display:block;margin:0 auto;border:0;outline:none;text-decoration:none;width:220px;max-width:100%;height:auto;"
                />
              </a>`
}

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
              ${emailLogoHtml()}
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
