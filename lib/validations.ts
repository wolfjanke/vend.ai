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
  deliveryAddress:  deliveryAddressSchema,
})

export type DeliveryAddressInput = z.infer<typeof deliveryAddressSchema>
