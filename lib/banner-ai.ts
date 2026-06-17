import { genAI, GEMINI_MODELS } from '@/lib/gemini'
import { stripEmojis } from '@/lib/strip-emoji'
import { BANNER_TEXT_MAX_CHARS } from '@/lib/banners'
import type { CouponRule } from '@/types'

export type BannerTextInput = {
  storeName:           string
  hint?:               string
  startDate?:          string
  endDate?:            string
  pixDiscountPercent?: number
  couponRules?:        CouponRule[]
  freteInfo?:          string
  freeShippingMin?:    number | null
}

export type BannerTextResult = {
  suggestions: string[]
}

function formatCouponSummary(rules: CouponRule[] | undefined): string {
  if (!rules?.length) return 'nenhum cupom ativo'
  return rules
    .filter(c => c.active && c.code.trim())
    .map(c => {
      const val = c.type === 'percent' ? `${c.value}%` : `R$ ${c.value}`
      return `${c.code} (${val})`
    })
    .join(', ') || 'nenhum cupom ativo'
}

function buildBannerTextPrompt(input: BannerTextInput): string {
  const period =
    input.startDate && input.endDate
      ? `${input.startDate} a ${input.endDate}`
      : input.startDate
        ? `a partir de ${input.startDate}`
        : input.endDate
          ? `até ${input.endDate}`
          : 'sem data fixa'

  return `Você escreve avisos curtos para faixa no topo de loja virtual brasileira (mobile).
Loja: ${input.storeName}
Ideia ou rascunho (opcional): ${input.hint?.trim() || '—'}
Período: ${period}
Cupons ativos: ${formatCouponSummary(input.couponRules)}
Desconto PIX: ${input.pixDiscountPercent ? `${input.pixDiscountPercent}%` : 'não configurado'}
Frete (info da loja): ${input.freteInfo?.trim() || '—'}
Frete grátis a partir de: ${input.freeShippingMin != null ? `R$ ${input.freeShippingMin}` : '—'}

Retorne APENAS JSON válido:
{
  "suggestions": [
    "frase 1",
    "frase 2",
    "frase 3"
  ]
}

Regras:
- Exatamente 3 sugestões, cada uma em uma linha só
- Máximo ${BANNER_TEXT_MAX_CHARS} caracteres por sugestão
- Tom direto, venda/confiança, sem emoji, sem aspas extras
- Priorize cupom, PIX ou frete quando existirem; use a ideia/rascunho se houver
- Não invente percentuais ou códigos que não foram informados`
}

function parseBannerTextResult(raw: string): BannerTextResult {
  const trimmed = raw.trim()
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Resposta inválida da IA')

  const parsed = JSON.parse(jsonMatch[0]) as { suggestions?: unknown }
  const suggestions = Array.isArray(parsed.suggestions)
    ? parsed.suggestions
        .filter((s): s is string => typeof s === 'string')
        .map(s => stripEmojis(s).trim())
        .filter(Boolean)
        .map(s => (s.length > BANNER_TEXT_MAX_CHARS ? `${s.slice(0, BANNER_TEXT_MAX_CHARS - 1)}…` : s))
        .slice(0, 3)
    : []

  if (!suggestions.length) throw new Error('Nenhuma sugestão gerada')
  return { suggestions }
}

export async function generateBannerTexts(input: BannerTextInput): Promise<BannerTextResult> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY não configurada')
  }

  const model = genAI.getGenerativeModel({ model: GEMINI_MODELS.bannerText })
  const result = await model.generateContent(buildBannerTextPrompt(input))
  const text = result.response.text?.() ?? ''
  return parseBannerTextResult(text)
}
