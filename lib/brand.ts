/** Marca pública — vendai.club (não confundir com vendeai.io). */

export const BRAND_GRADIENT = {

  main:         'linear-gradient(90deg, #5C7BFF 0%, #41A8FF 50%, #22D9C3 100%)',

  club:         'linear-gradient(90deg, #41A8FF 0%, #22D9C3 100%)',

  clubScale:    0.42,

  clubOffsetX:  '-2%',

  clubOffsetY:  '-5%',

} as const



/** Assets vetoriais — fonte única: `public/brand/wordmark.svg` (fundo transparente). */
export const BRAND_LOGO = {
  wordmark:       '/brand/wordmark.svg',
  wordmarkEmail:  '/brand/wordmark-email.png',
  wordmarkSquare: '/brand/wordmark-square.svg',
  ogImage:        '/brand/og-image.svg',
  favicon:        '/favicon.svg',
} as const



export const BRAND = {

  name:         process.env.PRODUCT_NAME ?? 'vendai',

  domain:       process.env.PRODUCT_DOMAIN ?? 'vendai.club',

  displayName:  process.env.PRODUCT_DISPLAY_NAME ?? 'vendai.club',

  alt:          'vendai.club — vitrine online com IA para moda',

  supportEmail: process.env.SUPPORT_EMAIL ?? 'suporte@vend.ai',

  privacyEmail: process.env.PRIVACY_EMAIL ?? 'privacidade@vend.ai',

  notToConfuse: 'vendai.club não é o VendeAI (vendeai.io) — produto e empresa diferentes.',

  bg:           '#050814',

  favicon:      BRAND_LOGO.favicon,

  appleTouch:   BRAND_LOGO.wordmark,

  ogImage:      BRAND_LOGO.ogImage,

} as const



/** URL pública da loja: vendai.club/slug */

export function storePublicPath(slug: string): string {

  return `${BRAND.domain}/${slug}`

}

