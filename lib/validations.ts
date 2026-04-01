import { z } from 'zod'
import { digitsOnly, isValidBrazilPhoneDigits } from '@/lib/masks'

const phoneDigits = z
  .string()
  .transform(s => digitsOnly(s))
  .refine(d => isValidBrazilPhoneDigits(d), 'WhatsApp inválido (use DDD + número)')

export const registerSchema = z.object({
  email:     z.string().email('E-mail inválido'),
  password:  z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
  storeName: z.string().min(1, 'Nome da loja obrigatório').max(200),
  whatsapp:  phoneDigits,
  genderFocus: z.enum(['feminine', 'masculine', 'unisex', 'mixed']).optional(),
  ageGroup:    z.enum(['adult', 'kids', 'all']).optional(),
})

export const storeAddressSchema = z.object({
  cep:         z.string().optional(),
  logradouro:  z.string().optional(),
  numero:      z.string().optional(),
  complemento: z.string().optional(),
  bairro:      z.string().optional(),
  cidade:      z.string().optional(),
  uf:          z.string().max(2).optional(),
})

export const storeSettingsPatchSchema = z.object({
  name:           z.string().min(1).max(200),
  whatsapp:       phoneDigits,
  logo_url:       z.string().nullable().optional(),
  freteInfo:      z.string().optional(),
  pagamentoInfo:  z.string().optional(),
  pixDiscountPercent: z.number().min(0).max(100).optional(),
  couponRules: z.array(z.object({
    id:               z.string(),
    code:             z.string().min(1).max(64),
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
    title:     z.string().optional(),
    text:      z.string(),
    startDate: z.string().optional(),
    endDate:   z.string().optional(),
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

const variantSchema = z.object({
  id:        z.string(),
  color:     z.string(),
  colorHex:  z.string(),
  photos:    z.array(z.string()),
  stock:     z.record(z.string(), z.number()),
}).passthrough()

export const productBodySchema = z.object({
  name:          z.string().min(1).max(500),
  description:   z.string().max(20_000).optional().default(''),
  category:      z.string().max(50).optional().transform(s => (s && String(s).trim()) ? String(s).trim() : 'outro'),
  price:         z.number().nonnegative(),
  promo_price:   z.number().nonnegative().nullable().optional(),
  variants_json: z.array(variantSchema),
  active:        z.boolean().optional().default(true),
})

export const deliveryAddressSchema = z.object({
  cep: z
    .string()
    .refine(s => digitsOnly(s).length === 8, 'CEP inválido'),
  logradouro:  z.string().min(1, 'Logradouro obrigatório'),
  numero:      z.string().min(1, 'Número obrigatório'),
  complemento: z.string().optional(),
  bairro:      z.string().min(1, 'Bairro obrigatório'),
  cidade:      z.string().min(1, 'Cidade obrigatória'),
  uf:          z.string().min(2).max(2, 'UF inválida').transform(s => s.toUpperCase()),
})

export const orderCreateSchema = z.object({
  storeId:          z.string().uuid(),
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
  notes:            z.string().max(5000).optional(),
  paymentMethod:    z.enum(['PIX', 'CARTAO', 'DINHEIRO', 'OUTRO']).default('OUTRO'),
  couponCode:       z.string().trim().max(64).optional(),
  deliveryAddress:  deliveryAddressSchema,
  deliveryFee:      z.number().nonnegative(),
  checkoutChannel:  z.enum(['site', 'whatsapp']),
})

export type DeliveryAddressInput = z.infer<typeof deliveryAddressSchema>
