import { z } from 'zod'
import { normalizeEmail } from '@/lib/email-normalize'
import { passwordSchema } from '@/lib/password-policy'
import { digitsOnly, isValidBrazilPhoneDigits, isValidCpf, isValidCnpj } from '@/lib/masks'
import { MAX_PAYMENT_LINKS } from '@/lib/payment-links'
import { stripEmojis } from '@/lib/strip-emoji'

const phoneDigits = z
  .string()
  .transform(s => digitsOnly(s))
  .refine(d => isValidBrazilPhoneDigits(d), 'WhatsApp inválido (use DDD + número)')

/** String sem emoji — aplica strip antes das demais regras. */
function noEmoji(min: number, max: number) {
  return z.string().transform(stripEmojis).pipe(z.string().min(min).max(max))
}

function noEmojiOptional(max: number) {
  return z
    .string()
    .max(max)
    .transform(stripEmojis)
    .optional()
}

function noEmojiNullable(max: number) {
  return z
    .string()
    .max(max)
    .nullable()
    .optional()
    .transform(s => {
      if (s == null) return s
      const cleaned = stripEmojis(s).trim()
      return cleaned === '' ? null : cleaned
    })
}

const themeNameRegister = z.enum([
  'default', 'boutique', 'street', 'editorial', 'pop', 'fitness', 'lumiere',
  'flash', 'casual', 'social',
]).optional()

export const registerSchema = z.object({
  ownerName: noEmoji(1, 200),
  email:     z.string().email('E-mail inválido').transform(normalizeEmail),
  password:  passwordSchema,
  storeName: noEmoji(1, 200),
  whatsapp:  phoneDigits,
  termsAccepted: z.literal(true, { message: 'Aceite os termos de uso para continuar' }),
  genderFocus: z.enum(['feminine', 'masculine', 'unisex', 'mixed']).optional(),
  ageGroup:    z.enum(['adult', 'kids', 'all']).optional(),
  theme_name:            themeNameRegister,
  theme_primary_color:   z.string().nullable().optional(),
  theme_secondary_color: z.string().nullable().optional(),
  theme_accent_color:    z.string().nullable().optional(),
  theme_background:      z.enum(['light', 'dark']).optional(),
  theme_shimmer:         z.boolean().optional(),
  theme_logo_url:        z.string().nullable().optional(),
  theme_onboarding_done: z.boolean().optional(),
})

export const storeSettingsPatchSchema = z.object({
  name:           noEmoji(1, 200),
  tagline:        noEmojiNullable(60),
  whatsapp:       phoneDigits,
  logo_url:       z.string().nullable().optional(),
  logoSize:       z.enum(['sm', 'md', 'lg']).optional(),
  logoShape:      z.enum(['rect', 'square', 'circle']).optional(),
  brandDisplay:   z.enum(['logo-and-name', 'logo-only', 'name-only']).optional(),
  headerLayout:   z.enum(['bar', 'centered']).optional(),
  showSearch:     z.boolean().optional(),
  mobileGridCols: z.union([z.literal(2), z.literal(3)]).optional(),
  freteInfo:      noEmojiOptional(2000),
  pagamentoInfo:  noEmojiOptional(2000),
  pixKey:         z.string().max(77).optional().transform(s => s?.trim() || ''),
  paymentLinks: z.array(z.object({
    id:     z.string(),
    label:  z.string().min(2).max(40).transform(stripEmojis).pipe(z.string().min(2).max(40)),
    url:    z.string().url('URL inválida — use https://').refine(u => u.startsWith('https://'), 'Use URL com https://'),
    active: z.boolean().optional(),
  })).max(MAX_PAYMENT_LINKS).optional(),
  pixDiscountPercent: z.number().min(0).max(100).optional(),
  couponRules: z.array(z.object({
    id:               z.string(),
    code:             z.string().min(1).max(64).transform(stripEmojis).pipe(z.string().min(1).max(64)),
    type:             z.enum(['percent', 'fixed']),
    value:            z.number().nonnegative(),
    active:           z.boolean(),
    startDate:        z.string().optional(),
    endDate:          z.string().optional(),
    minOrderValue:    z.number().nonnegative().optional(),
    maxDiscountValue: z.number().nonnegative().optional(),
  })).optional(),
  bannerMessages: z.array(z.object({
    id:        z.string(),
    title:     z.string().max(120).transform(stripEmojis).optional(),
    text:      z.string().transform(stripEmojis).pipe(z.string().min(1).max(500)),
    startDate: z.string().optional(),
    endDate:   z.string().optional(),
    motion:    z.enum(['none', 'pulse']).optional(),
  })).optional(),
  cep:         z.string().optional(),
  logradouro:  z.string().optional(),
  numero:      z.string().optional(),
  complemento: z.string().optional(),
  bairro:      z.string().optional(),
  cidade:      z.string().optional(),
  uf:          z.string().max(2).optional(),
  genderFocus: z.enum(['feminine', 'masculine', 'unisex', 'mixed']).optional(),
  ageGroup:    z.enum(['adult', 'kids', 'all']).optional(),
  checkoutChannels: z.object({
    siteEnabled:     z.boolean().optional(),
    whatsappEnabled: z.boolean().optional(),
  }).optional(),
  deliveryZones: z.array(z.object({
    id:   z.string(),
    city: z.string().min(1),
    uf:   z.string().min(2).max(2),
    fee:  z.number().nonnegative(),
  })).optional(),
  freeShippingMin: z.number().nonnegative().nullable().optional(),
  installmentsMaxNoInterest: z.number().int().min(1).max(48).nullable().optional(),
  viDailyLimit: z.number().int().min(1).max(100_000).nullable().optional(),
  stockAlerts: z.object({
    enabled:   z.boolean(),
    threshold: z.number().int().min(1).max(99),
  }).optional(),
  assistant_name: z
    .string()
    .max(20, 'Máximo 20 caracteres')
    .regex(/^[A-Za-zÀ-ÿ\s]+$/, 'Use apenas letras e espaços')
    .optional(),
  assistant_welcome_message: noEmojiNullable(500),
  assistant_tone: z.enum(['friendly', 'formal', 'playful', 'professional']).optional(),
  assistant_gender: z.enum(['feminine', 'masculine', 'neutral']).optional(),
}).superRefine((data, ctx) => {
  const couponRules = data.couponRules ?? []
  for (let idx = 0; idx < couponRules.length; idx++) {
    const c = couponRules[idx]
    if (c.type === 'percent' && c.value > 100) {
      ctx.addIssue({ code: 'custom', path: ['couponRules', idx, 'value'], message: 'Cupom percentual deve ser de 0 a 100' })
    }
    if (c.startDate && c.endDate && c.startDate > c.endDate) {
      ctx.addIssue({ code: 'custom', path: ['couponRules', idx, 'endDate'], message: 'Data final do cupom deve ser maior ou igual à inicial' })
    }
  }
  const bannerMessages = data.bannerMessages ?? []
  for (let idx = 0; idx < bannerMessages.length; idx++) {
    const b = bannerMessages[idx]
    if (!b.text.trim()) {
      ctx.addIssue({ code: 'custom', path: ['bannerMessages', idx, 'text'], message: 'Texto do banner é obrigatório' })
    }
    if (b.startDate && b.endDate && b.startDate > b.endDate) {
      ctx.addIssue({ code: 'custom', path: ['bannerMessages', idx, 'endDate'], message: 'Data final do banner deve ser maior ou igual à inicial' })
    }
  }
})

const stockPriceRecord = z.record(z.string(), z.number().nonnegative())

const variantSchema = z.object({
  id:          z.string(),
  color:       z.string(),
  colorHex:    z.string(),
  photos:      z.array(z.string()),
  stock:       z.record(z.string(), z.number()),
  variantType: z.enum(['cor', 'modelo', 'tamanho', 'estampa', 'material']).optional(),
  stockPrices:      stockPriceRecord.optional(),
  stockPromoPrices: stockPriceRecord.optional(),
}).passthrough()

const catalogAxesSchema = z.object({
  primaryAxis: z.enum(['color', 'model', 'none']),
  stockAxis:   z.enum(['clothing', 'volume', 'unique', 'numeric']),
}).nullable().optional()

export const productBodySchema = z.object({
  name:          noEmoji(1, 500),
  brand:         noEmojiNullable(120),
  description:   z.string().max(20_000).transform(stripEmojis).optional().default(''),
  category:      z.string().max(50).optional().transform(s => (s && String(s).trim()) ? String(s).trim() : 'outro'),
  audience:      z.enum(['feminine', 'masculine', 'unisex', 'kids']).nullable().optional(),
  price:         z.number().nonnegative(),
  promo_price:   z.number().nonnegative().nullable().optional(),
  variants_json: z.array(variantSchema),
  catalog_axes:  catalogAxesSchema,
  active:        z.boolean().optional().default(true),
})

const deliveryAddressFieldsSchema = z.object({
  cep:         z.string(),
  logradouro:  z.string(),
  numero:      z.string(),
  complemento: z.string().optional(),
  bairro:      z.string(),
  cidade:      z.string(),
  uf:          z.string(),
})

export function isDeliveryAddressEmpty(
  addr: {
    cep?:         string | null
    logradouro?:  string | null
    numero?:      string | null
    bairro?:      string | null
    cidade?:      string | null
    uf?:          string | null
  } | null | undefined,
): boolean {
  if (!addr) return true
  return !(
    addr.cep?.trim() ||
    addr.logradouro?.trim() ||
    addr.numero?.trim() ||
    addr.bairro?.trim() ||
    addr.cidade?.trim() ||
    addr.uf?.trim()
  )
}

export const deliveryAddressSchema = deliveryAddressFieldsSchema
  .superRefine((data, ctx) => {
    if (isDeliveryAddressEmpty(data)) return

    if (digitsOnly(data.cep).length !== 8) {
      ctx.addIssue({ code: 'custom', path: ['cep'], message: 'CEP inválido' })
    }
    if (!data.logradouro.trim()) {
      ctx.addIssue({ code: 'custom', path: ['logradouro'], message: 'Logradouro obrigatório' })
    }
    if (!data.numero.trim()) {
      ctx.addIssue({ code: 'custom', path: ['numero'], message: 'Número obrigatório' })
    }
    if (!data.bairro.trim()) {
      ctx.addIssue({ code: 'custom', path: ['bairro'], message: 'Bairro obrigatório' })
    }
    if (!data.cidade.trim()) {
      ctx.addIssue({ code: 'custom', path: ['cidade'], message: 'Cidade obrigatória' })
    }
    const uf = data.uf.trim().toUpperCase()
    if (uf.length !== 2) {
      ctx.addIssue({ code: 'custom', path: ['uf'], message: 'UF inválida' })
    }
  })
  .transform(data => {
    if (isDeliveryAddressEmpty(data)) return null
    const cepDigits = digitsOnly(data.cep)
    return {
      cep:         `${cepDigits.slice(0, 5)}-${cepDigits.slice(5)}`,
      logradouro:  data.logradouro.trim(),
      numero:      data.numero.trim(),
      complemento: data.complemento?.trim() || undefined,
      bairro:      data.bairro.trim(),
      cidade:      data.cidade.trim(),
      uf:          data.uf.trim().toUpperCase(),
    }
  })

export type DeliveryAddressInput = NonNullable<z.infer<typeof deliveryAddressSchema>>

const checkoutCartLineSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string(),
  size:       z.string().min(1),
  color:      z.string().optional(),
  qty:        z.number().int().positive(),
  name:       z.string().optional(),
  photo:      z.string().optional(),
})

const cpfDigits = z
  .string()
  .transform(s => digitsOnly(s))
  .refine(d => isValidCpf(d), 'CPF inválido')

const optionalCpfDigits = z
  .string()
  .optional()
  .transform(s => {
    const d = digitsOnly(s ?? '')
    return d.length > 0 ? d : undefined
  })
  .refine(d => d === undefined || isValidCpf(d), 'CPF inválido')

export const checkoutPaymentSchema = z.object({
  storeSlug:        z.string().min(2).max(40).optional(),
  billingType:      z.enum(['PIX', 'CREDIT_CARD']),
  installments:     z.number().int().min(1).max(12).default(1),
  /** Subtotal dos itens (soma linhas) — validação de catálogo. */
  grossValue:       z.number().positive(),
  /** Total após cupom e desconto PIX (antes de juros do cartão). */
  payableValue:     z.number().nonnegative(),
  couponCode:       z.string().trim().max(64).optional(),
  creditCardToken:  z.string().optional(),
  interestBearer:   z.enum(['customer', 'merchant']).optional().default('customer'),
  cartItems:        z.array(checkoutCartLineSchema).min(1),
  customer: z.object({
    name:        z.string().min(1).max(200),
    cpfCnpj:     cpfDigits,
    email:       z.string().email('E-mail inválido'),
    mobilePhone: phoneDigits,
  }),
  items: z.array(z.object({
    description: z.string(),
    quantity:    z.number().int().positive(),
    value:       z.number().nonnegative(),
  })).min(1).optional(),
})

export const orderCreateSchema = z.object({
  storeSlug:        z.string().min(2).max(40),
  items:            z.array(z.object({
    product_id: z.string(),
    variant_id: z.string(),
    name:       z.string(),
    size:       z.string(),
    color:      z.string(),
    qty:        z.number().int().positive(),
    price:      z.number().nonnegative(),
    photo:      z.string().optional(),
  })).min(1),
  customerName:     z.string().min(1).max(200),
  customerWhatsapp: phoneDigits,
  customerCpf:      optionalCpfDigits,
  notes:            z.string().max(5000).optional(),
  paymentMethod:    z.enum(['PIX', 'CARTAO', 'DINHEIRO', 'OUTRO']).default('OUTRO'),
  couponCode:       z.string().trim().max(64).optional(),
  deliveryAddress:  deliveryAddressSchema,
  deliveryFee:      z.number().nonnegative(),
  checkoutChannel:  z.enum(['site', 'whatsapp']),
  payment_source:   z.enum(['WHATSAPP', 'CHECKOUT', 'PDV']).optional().default('WHATSAPP'),
  privacyConsent:   z.literal(true, {
    message: 'É necessário aceitar a política de privacidade',
  }),
})

export const lgpdExclusaoSchema = z.object({
  storeSlug:        z.string().min(2).max(40),
  customerWhatsapp: z.string().min(10).max(20),
  orderNumber:      z.string().regex(/^\d{4}$/, 'Número do pedido inválido (4 dígitos)'),
})

const quoteUpdateItemSchema = z.object({
  product_id: z.string().min(1),
  variant_id: z.string().min(1),
  name:       z.string().min(1),
  size:       z.string().min(1),
  color:      z.string().optional().default(''),
  qty:        z.coerce.number().int().positive(),
  price:      z.coerce.number().nonnegative(),
  photo:      z.string().optional(),
})

export const quoteUpdateSchema = z.object({
  items: z.array(quoteUpdateItemSchema).min(1),
  notes: z.string().max(5000).optional(),
})

const billingAddressFieldsSchema = z.object({
  cep:         z.string(),
  logradouro:  z.string(),
  numero:      z.string(),
  complemento: z.string().optional(),
  bairro:      z.string(),
  cidade:      z.string(),
  uf:          z.string(),
})

export const billingOwnerSchema = z.object({
  type: z.enum(['pf', 'pj']),
  cpfCnpj: z.string().transform(s => digitsOnly(s)),
  legalName: noEmojiOptional(200),
  address: billingAddressFieldsSchema.optional(),
}).superRefine((data, ctx) => {
  if (data.type === 'pf') {
    if (data.cpfCnpj.length !== 11 || !isValidCpf(data.cpfCnpj)) {
      ctx.addIssue({ code: 'custom', path: ['cpfCnpj'], message: 'CPF inválido' })
    }
    if (!data.legalName?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['legalName'], message: 'Nome completo do titular obrigatório' })
    }
  } else {
    if (data.cpfCnpj.length !== 14 || !isValidCnpj(data.cpfCnpj)) {
      ctx.addIssue({ code: 'custom', path: ['cpfCnpj'], message: 'CNPJ inválido' })
    }
    if (!data.legalName?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['legalName'], message: 'Razão social obrigatória' })
    }
  }

  if (data.address && !isDeliveryAddressEmpty(data.address)) {
    if (digitsOnly(data.address.cep).length !== 8) {
      ctx.addIssue({ code: 'custom', path: ['address', 'cep'], message: 'CEP inválido' })
    }
    if (!data.address.logradouro.trim()) {
      ctx.addIssue({ code: 'custom', path: ['address', 'logradouro'], message: 'Logradouro obrigatório' })
    }
    if (!data.address.numero.trim()) {
      ctx.addIssue({ code: 'custom', path: ['address', 'numero'], message: 'Número obrigatório' })
    }
    if (!data.address.bairro.trim()) {
      ctx.addIssue({ code: 'custom', path: ['address', 'bairro'], message: 'Bairro obrigatório' })
    }
    if (!data.address.cidade.trim()) {
      ctx.addIssue({ code: 'custom', path: ['address', 'cidade'], message: 'Cidade obrigatória' })
    }
    if (data.address.uf.trim().toUpperCase().length !== 2) {
      ctx.addIssue({ code: 'custom', path: ['address', 'uf'], message: 'UF inválida' })
    }
  }
})

export type BillingOwnerInput = z.infer<typeof billingOwnerSchema>
