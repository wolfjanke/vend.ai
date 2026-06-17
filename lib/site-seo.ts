/** URL canônica e fatos públicos — metadata, sitemap, llms.txt, JSON-LD. */
import { BRAND } from '@/lib/brand'

export const SITE_ORIGIN = (
  process.env.NEXT_PUBLIC_APP_URL ?? `https://${BRAND.domain}`
).replace(/\/$/, '')

export function siteUrl(path = ''): string {
  if (!path) return SITE_ORIGIN
  return `${SITE_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`
}

export const SITE_ENTITY = {
  productName:   BRAND.displayName,
  legalName:     'Wolf Hub Desenvolvimento de Software Não Customizável Ltda',
  domain:        BRAND.domain,
  canonicalUrl:  SITE_ORIGIN,
  category:      'Vitrine online com IA para quem vende moda no Instagram e WhatsApp',
  tagline:       'Catálogo em minutos. A Vi responde com seu estoque e manda o pedido formatado no WhatsApp.',
  audience:      'Lojistas de moda, brechós, revendedoras e pequenas marcas no Brasil',
  notToConfuse:  BRAND.notToConfuse,
  demoStorePath: '/urban-mix',
  supportEmail:  BRAND.supportEmail,
} as const

export const SITE_DESCRIPTION =
  'vendai.club: vitrine de moda com IA que responde no Direct e manda pedido formatado no WhatsApp. Catálogo, assistente Vi, estoque por SKU. Plano grátis. Wolf Hub, Brasil.'

export const SITE_KEYWORDS = [
  'vendai.club',
  'vitrine online moda',
  'loja moda WhatsApp',
  'IA vendas moda',
  'assistente Vi',
  'catálogo digital moda',
  'brechó online',
  'revenda moda Instagram',
  'vitrine moda Instagram',
  'assistente Direct moda',
] as const

export const SITE_TITLE = `${BRAND.displayName} — Vitrine online com IA para moda`
