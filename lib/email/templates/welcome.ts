import { baseTemplate } from './base'
import { EMAIL_CONFIG } from '../index'

interface WelcomeEmailProps {
  ownerName: string
  storeName: string
  storeSlug: string
  plan: string
  planLabel: string
  trialDays?: number
  assistantName: string
}

export function welcomeEmailHtml(props: WelcomeEmailProps): string {
  const {
    ownerName,
    storeName,
    storeSlug,
    planLabel,
    trialDays,
    assistantName,
  } = props

  const storeUrl = `${EMAIL_CONFIG.baseUrl}/${storeSlug}`
  const adminUrl = `${EMAIL_CONFIG.baseUrl}/admin`

  const content = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#1A1A1A;">
      Bem-vindo ao vend.ai, ${ownerName}!
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#666666;">
      Sua loja <strong>${storeName}</strong> está no ar e pronta para vender.
    </p>

    <div style="background:#F0F0FF;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 8px;font-size:13px;color:#666666;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">
        Link da sua loja
      </p>
      <a href="${storeUrl}" style="font-size:18px;font-weight:700;color:#7B6EFF;text-decoration:none;">
        vendai.club/${storeSlug}
      </a>
      <p style="margin:8px 0 0;font-size:12px;color:#888888;">
        Compartilhe esse link com seus clientes!
      </p>
    </div>

    <div style="background:#F9F9F9;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#1A1A1A;text-transform:uppercase;letter-spacing:0.5px;">
        Seu Plano
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:13px;color:#666666;padding:4px 0;">Plano atual</td>
          <td style="font-size:13px;color:#1A1A1A;font-weight:600;text-align:right;">${planLabel}</td>
        </tr>
        ${trialDays ? `
        <tr>
          <td style="font-size:13px;color:#666666;padding:4px 0;">Trial gratuito</td>
          <td style="font-size:13px;color:#00A86B;font-weight:600;text-align:right;">${trialDays} dias grátis</td>
        </tr>
        ` : ''}
        <tr>
          <td style="font-size:13px;color:#666666;padding:4px 0;">Assistente IA</td>
          <td style="font-size:13px;color:#1A1A1A;font-weight:600;text-align:right;">${assistantName}</td>
        </tr>
      </table>
    </div>

    <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#1A1A1A;text-transform:uppercase;letter-spacing:0.5px;">
      Próximos passos
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #F0F0F0;">
          <span style="display:inline-block;width:22px;height:22px;border-radius:50%;background:#7B6EFF;color:#FFFFFF;font-size:12px;font-weight:700;text-align:center;line-height:22px;">1</span>
          <span style="font-size:13px;color:#333333;margin-left:8px;">
            Cadastre seus produtos — a IA preenche nome e descrição pela foto
          </span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #F0F0F0;">
          <span style="display:inline-block;width:22px;height:22px;border-radius:50%;background:#7B6EFF;color:#FFFFFF;font-size:12px;font-weight:700;text-align:center;line-height:22px;">2</span>
          <span style="font-size:13px;color:#333333;margin-left:8px;">
            Compartilhe o link da sua loja no Instagram e WhatsApp
          </span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;">
          <span style="display:inline-block;width:22px;height:22px;border-radius:50%;background:#7B6EFF;color:#FFFFFF;font-size:12px;font-weight:700;text-align:center;line-height:22px;">3</span>
          <span style="font-size:13px;color:#333333;margin-left:8px;">
            Receba pedidos organizados direto no seu WhatsApp
          </span>
        </td>
      </tr>
    </table>

    <div style="background:#FFF8E1;border-left:4px solid #FFB800;border-radius:0 8px 8px 0;padding:16px;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#7A5900;">
        Importante — Nota Fiscal
      </p>
      <p style="margin:0;font-size:12px;color:#7A5900;line-height:1.6;">
        O vend.ai não emite notas fiscais das suas vendas. Essa responsabilidade
        é sua como lojista, conforme legislação vigente. O vend.ai emite NF apenas
        referente à assinatura mensal da plataforma.
      </p>
    </div>

    <div style="text-align:center;margin-bottom:24px;">
      <a href="${adminUrl}"
         style="display:inline-block;background:linear-gradient(135deg,#7B6EFF,#00E5A0);
                color:#FFFFFF;font-weight:700;font-size:15px;padding:14px 32px;
                border-radius:12px;text-decoration:none;">
        Acessar meu painel →
      </a>
    </div>

    <p style="margin:0;font-size:11px;color:#AAAAAA;text-align:center;line-height:1.6;">
      Ao criar sua conta você aceitou nossos
      <a href="${EMAIL_CONFIG.baseUrl}/termos" style="color:#7B6EFF;">Termos de Uso</a>
      e a
      <a href="${EMAIL_CONFIG.baseUrl}/privacidade" style="color:#7B6EFF;">Política de Privacidade</a>.
      O contrato completo está anexo a este e-mail.
    </p>
  `

  return baseTemplate(content, `Bem-vindo ao vend.ai! Sua loja ${storeName} está no ar.`)
}
