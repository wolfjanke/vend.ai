// ─── Order Status ──────────────────────────────────────────────────────────────
export type OrderStatus = 'NOVO' | 'CONFIRMADO' | 'EM_ENTREGA' | 'ENTREGUE' | 'CANCELADO'

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  NOVO:       'Novo',
  CONFIRMADO: 'Confirmado',
  EM_ENTREGA: 'Em Entrega',
  ENTREGUE:   'Entregue',
  CANCELADO:  'Cancelado',
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  NOVO:       'text-primary bg-primary/10 border-primary/30',
  CONFIRMADO: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  EM_ENTREGA: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  ENTREGUE:   'text-accent bg-accent/10 border-accent/30',
  CANCELADO:  'text-warm bg-warm/10 border-warm/30',
}

// ─── Plan ─────────────────────────────────────────────────────────────────────
export type PlanSlug = 'free' | 'starter' | 'pro' | 'loja'

export const PLAN_PRODUCT_LIMITS: Record<PlanSlug, number | null> = {
  free:    10,
  starter: 25,
  pro:     50,
  loja:    null, // ilimitado
}

// ─── Store ────────────────────────────────────────────────────────────────────
export interface BannerMessage {
  id:        string
  title:     string
  text:      string
  startDate?: string
  endDate?:  string
  theme?:    string
}

export type CouponType = 'percent' | 'fixed'

export interface CouponRule {
  id:               string
  code:             string
  type:             CouponType
  value:            number
  active:           boolean
  startDate?:       string
  endDate?:         string
  minOrderValue?:   number
  maxDiscountValue?: number
}

/** Público principal da loja (cadastro + config) */
export type GenderFocus = 'feminine' | 'masculine' | 'unisex' | 'mixed'
/** Faixa etária principal */
export type AgeGroup = 'adult' | 'kids' | 'all'

export interface StoreProfile {
  genderFocus: GenderFocus
  ageGroup:    AgeGroup
}

/** Zona de entrega: cidade + UF com taxa fixa (comparação normalizada). */
export interface DeliveryZone {
  id:   string
  city: string
  uf:   string
  fee:  number
}

/** Finalização: site (checkout online, quando disponível) vs WhatsApp. */
export interface CheckoutChannelsConfig {
  siteEnabled?:     boolean
  whatsappEnabled?: boolean
}

export interface StoreSettings {
  theme?:            'dark' | 'light'
  welcomeMessage?:   string
  inactivityDelay?:  number
  freteInfo?:        string
  pagamentoInfo?:    string
  bannerMessages?:   BannerMessage[]
  pixDiscountPercent?: number
  couponRules?:      CouponRule[]
  genderFocus?:      GenderFocus
  ageGroup?:         AgeGroup
  /** Finalizar pelo site / pelo WhatsApp (lojista configura). */
  checkoutChannels?: CheckoutChannelsConfig
  /** Cidades atendidas com taxa. Lista vazia = sem restrição e frete R$ 0. */
  deliveryZones?:    DeliveryZone[]
  /** Frete grátis quando subtotal após cupom >= valor (antes do desconto PIX). */
  freeShippingMin?: number | null
  /** Máximo de parcelas sem juros (vitrine: linha Nx R$ … no card). Vazio = não exibir. */
  installmentsMaxNoInterest?: number | null
}

export type CheckoutChannel = 'site' | 'whatsapp'
export type CheckoutPaymentMethod = 'PIX' | 'CARTAO' | 'DINHEIRO' | 'OUTRO'

const DEFAULT_STORE_PROFILE: StoreProfile = {
  genderFocus: 'feminine',
  ageGroup:    'adult',
}

export function getStoreProfile(settings: StoreSettings | undefined | null): StoreProfile {
  const g = settings?.genderFocus
  const a = settings?.ageGroup
  return {
    genderFocus:
      g === 'masculine' || g === 'unisex' || g === 'mixed' ? g : DEFAULT_STORE_PROFILE.genderFocus,
    ageGroup: a === 'kids' || a === 'all' ? a : DEFAULT_STORE_PROFILE.ageGroup,
  }
}

export function getSegmentLabel(profile: StoreProfile): string {
  const g: Record<GenderFocus, string> = {
    feminine: 'público feminino',
    masculine: 'público masculino',
    unisex: 'público unissex',
    mixed: 'mixto (feminino e masculino)',
  }
  const a: Record<AgeGroup, string> = {
    adult: 'adulto',
    kids: 'infantil',
    all: 'todas as idades',
  }
  return `Loja de ${g[profile.genderFocus]}, foco ${a[profile.ageGroup]}.`
}

export function getSearchPlaceholder(profile: StoreProfile): string {
  if (profile.ageGroup === 'kids') {
    return 'Ex: conjunto infantil tamanho 6, body menina…'
  }
  if (profile.genderFocus === 'masculine') {
    return 'Ex: camiseta básica M, bermuda jeans…'
  }
  if (profile.genderFocus === 'unisex') {
    return 'Ex: moletom G, calça jeans 42…'
  }
  if (profile.genderFocus === 'mixed') {
    return 'Ex: vestido festa P, camiseta masculina G…'
  }
  return 'Descreva o que procura… Ex: vestido floral para festa, tamanho M'
}

/** Endereço da loja (lojista) — opcional */
export interface StoreAddress {
  cep?:         string | null
  logradouro?:  string | null
  numero?:      string | null
  complemento?: string | null
  bairro?:      string | null
  cidade?:      string | null
  uf?:          string | null
}

export interface Store extends StoreAddress {
  id:            string
  slug:          string
  name:          string
  logo_url:      string | null
  whatsapp:      string
  settings_json: StoreSettings
  created_at:    string
  user_id:       string
  plan?:         PlanSlug
}

// ─── Product ──────────────────────────────────────────────────────────────────
export interface ProductVariant {
  id:       string
  color:    string
  colorHex: string
  photos:   string[]
  stock:    Record<string, number>
}

export interface Product {
  id:            string
  store_id:      string
  name:          string
  description:   string
  category:      string
  price:         number
  promo_price:   number | null
  variants_json: ProductVariant[]
  active:        boolean
  created_at:    string
}

/** Uma linha na vitrine: mesmo produto, uma cor/variação fixa (dados seguem em `Product.variants_json`). */
export interface ProductVariantDisplay {
  product:      Product
  variantIndex: number
}

// ─── Cart ─────────────────────────────────────────────────────────────────────
export interface CartItem {
  product_id: string
  variant_id: string
  name:       string
  size:       string
  color:      string
  qty:        number
  price:      number
  photo?:     string
  /** Texto curto exibido no carrinho (opcional) */
  description?: string
}

// ─── Order ────────────────────────────────────────────────────────────────────
export interface OrderItem {
  product_id: string
  name:       string
  size:       string
  color:      string
  qty:        number
  price:      number
}

/** Endereço de entrega do cliente (checkout) */
export interface DeliveryAddress {
  cep:         string
  logradouro:  string
  numero:      string
  complemento?: string
  bairro:      string
  cidade:      string
  uf:          string
}

export interface Order {
  id:                 string
  store_id:           string
  order_number:       string
  customer_name:      string
  customer_whatsapp:  string
  items_json:         OrderItem[]
  total:              number
  notes:              string
  status:             OrderStatus
  created_at:         string
  recovery_sent_at?:  string | null
  delivery_address?:  DeliveryAddress | null
  subtotal?:          number | null
  discount_pix?:      number | null
  discount_coupon?:   number | null
  discount_total?:    number | null
  total_final?:       number | null
  payment_method?:    'PIX' | 'OUTRO' | null
  coupon_code_applied?: string | null
}

// ─── Vi Chat ──────────────────────────────────────────────────────────────────
export interface ViMessage {
  role:    'user' | 'assistant'
  content: string
}

export interface StoreContext {
  name:           string
  freteInfo?:     string
  pagamentoInfo?: string
  /** Perfil da loja para tom da Vi */
  genderFocus?:   GenderFocus
  ageGroup?:      AgeGroup
  segmentLabel?:  string
  products: Array<{
    name:     string
    category: string
    price:    number
    sizes:    string[]
    colors:   string[]
    inStock:  boolean
  }>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const PRODUCT_CATEGORIES = [
  { value: 'vestido',  label: '👗 Vestidos' },
  { value: 'blusa',    label: '👚 Blusas' },
  { value: 'camiseta', label: '👕 Camisetas' },
  { value: 'calca',    label: '👖 Calças' },
  { value: 'bermuda',  label: '🩳 Bermudas' },
  { value: 'shorts',   label: '🩳 Shorts' },
  { value: 'conjunto', label: '✨ Conjuntos' },
  { value: 'saia',     label: '🌸 Saias' },
  { value: 'moletom',  label: '🧥 Moletons' },
  { value: 'casaco',   label: '🧥 Casacos / jaquetas' },
  { value: 'infantil', label: '👶 Infantil' },
  { value: 'outro',    label: '📦 Outro' },
]

export const PRODUCT_CATEGORY_SLUGS = PRODUCT_CATEGORIES.map(c => c.value)

/** Normaliza categoria vinda da IA para um slug conhecido */
export function normalizeProductCategory(raw: string): string {
  const t = String(raw ?? '').trim().toLowerCase()
  if (PRODUCT_CATEGORIES.some(c => c.value === t)) return t
  const synonyms: Record<string, string> = {
    camisa: 'camiseta', 't-shirt': 'camiseta', tshirt: 'camiseta', 't shirt': 'camiseta',
    jeans: 'calca', calça: 'calca', calças: 'calca',
    short: 'shorts',
    kids: 'infantil', criança: 'infantil', crianca: 'infantil',
    moletom: 'moletom', jaqueta: 'casaco',
  }
  return synonyms[t] ?? 'outro'
}

export const SIZES = ['PP', 'P', 'M', 'G', 'GG', 'Único']
