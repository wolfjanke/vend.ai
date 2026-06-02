import { baseTemplate } from './base'
import { EMAIL_CONFIG } from '../index'

interface UpgradeEmailProps {
  ownerName: string
  storeName: string
  newPlanLabel: string
  newPlanPrice: string
  renewalDay: number
  newFeatures: string[]
}

export function upgradeEmailHtml(props: UpgradeEmailProps): string {
  const { ownerName, storeName, newPlanLabel, newPlanPrice, renewalDay, newFeatures } = props

  const content = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#1A1A1A;">
      Plano atualizado com sucesso! 🚀
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#666666;">
      Olá, <strong>${ownerName}</strong>! Sua loja
      <strong>${storeName}</strong> agora está no plano ${newPlanLabel}.
    </p>

    <div style="background:linear-gradient(135deg,rgba(123,110,255,0.13),rgba(0,229,160,0.07));
                border:1px solid rgba(123,110,255,0.27);border-radius:12px;
                padding:24px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 4px;font-size:13px;color:#7B6EFF;font-weight:700;
                text-transform:uppercase;letter-spacing:0.5px;">
        Novo plano
      </p>
      <p style="margin:0 0 4px;font-size:28px;font-weight:800;color:#1A1A1A;">
        ${newPlanLabel}
      </p>
      <p style="margin:0;font-size:14px;color:#666666;">
        ${newPlanPrice} · Renovação todo dia ${renewalDay}
      </p>
    </div>

    <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#1A1A1A;
              text-transform:uppercase;letter-spacing:0.5px;">
      O que você ganhou neste upgrade
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${newFeatures.map(f => `
      <tr>
        <td style="padding:6px 0;border-bottom:1px solid #F0F0F0;font-size:13px;color:#333333;">
          <span style="color:#00A86B;font-weight:700;margin-right:8px;">✓</span>${f}
        </td>
      </tr>
      `).join('')}
    </table>

    <div style="text-align:center;margin-bottom:24px;">
      <a href="${EMAIL_CONFIG.baseUrl}/admin"
         style="display:inline-block;background:linear-gradient(135deg,#7B6EFF,#00E5A0);
                color:#FFFFFF;font-weight:700;font-size:15px;padding:14px 32px;
                border-radius:12px;text-decoration:none;">
        Explorar novos recursos →
      </a>
    </div>

    <p style="margin:0;font-size:12px;color:#AAAAAA;text-align:center;">
      Dúvidas? Responda este e-mail ou acesse
      <a href="${EMAIL_CONFIG.baseUrl}" style="color:#7B6EFF;">vendai.club</a>
    </p>
  `

  return baseTemplate(content, `Seu plano foi atualizado para ${newPlanLabel}!`)
}
