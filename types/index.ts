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
export type { PlanSlug } from '@/lib/plans'
export { PLAN_PRODUCT_LIMITS, PLANS, getPlan, formatPlanPrice, formatOverageLine, isPaidViPlan } from '@/lib/plans'
import type { PlanSlug } from '@/lib/plans'

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

/** Finalização: site (checkout online, quando disponível) vs WhatsApp. @deprecated Use checkout_mode na tabela stores. */
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
  /** Limite diário opcional de mensagens da Vi (lojista). */
  viDailyLimit?: number | null
  /** Categorias extras da loja (slug + rótulo exibido na vitrine e no admin). */
  customCategories?: CustomCategory[]
  /** Estilo da barra de categorias na vitrine. */
  categoryNavStyle?: 'pills' | 'circles'
  /** Tamanho da logo no header da vitrine: sm (P), md (M), lg (G). */
  logoSize?: 'sm' | 'md' | 'lg'
}

/** Categoria customizada por loja (valor = slug estável no produto). */
export interface CustomCategory {
  value:     string
  label:     string
  emoji?:    string
  imageUrl?: string | null
}

export type CheckoutMode =
  | 'whatsapp_only'
  | 'whatsapp_and_checkout'
  | 'checkout_only'

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
  tagline?:      string | null
  whatsapp:      string
  settings_json: StoreSettings
  created_at:    string
  user_id:       string
  theme_name?:              string
  theme_primary_color?:     string | null
  theme_secondary_color?:   string | null
  theme_accent_color?:      string | null
  theme_background?:        string
  theme_shimmer?:           boolean
  theme_logo_url?:          string | null
  theme_onboarding_done?:   boolean
  plan?:         PlanSlug
  /** Checkout integrado disponível na vitrine (derivado server-side). */
  checkoutSiteEnabled?:    boolean
  /** Finalizar pedido pelo WhatsApp na vitrine (derivado server-side). */
  checkoutWhatsappEnabled?: boolean
  /** Modo de recebimento configurado pelo lojista. */
  checkout_mode?:          CheckoutMode
  /** Loja de demonstração — checkout integrado desabilitado. */
  is_demo?:                boolean
  asaas_account_id?:       string
  asaas_wallet_id?:        string
  asaas_onboarding_status?: AsaasOnboardingStatus
  asaas_approved_at?:      string
  asaas_subscription_id?:  string | null
  asaas_billing_customer_id?: string | null
  subscription_status?:    SubscriptionStatus | null
  subscription_started_at?: string | null
  subscription_ends_at?:   string | null
  trial_ends_at?:          string | null
  terms_version?:          string | null
  terms_accepted_at?:      string | null
  terms_accepted_ip?:      string | null
  vi_messages_used?:       number
  vi_messages_reset_at?:   string
  vi_overage_messages?:    number
  vi_daily_limit?:         number | null
  photo_analysis_used?:    number
  assistant_name?:            string
  assistant_welcome_message?: string | null
  assistant_tone?:              'friendly' | 'formal' | 'playful' | 'professional'
  assistant_gender?:            'feminine' | 'masculine' | 'neutral'
}

// ─── Product ──────────────────────────────────────────────────────────────────
export type PrimaryAxis = 'color' | 'model' | 'none'
export type StockAxis = 'clothing' | 'volume' | 'unique'

export interface CatalogAxes {
  primaryAxis: PrimaryAxis
  stockAxis:   StockAxis
}

export type VariationKind = 'color' | 'volume' | 'bottle' | 'single' | 'concentration'

export type PhotoVariationHint = 'colors' | 'volumes' | 'concentrations' | 'unspecified'

export interface ProductAnalysisAttributes {
  brand?:          string
  line?:           string
  concentration?:  string
  volumeMl?:       number | null
}

export interface ProductVariant {
  id:          string
  color:       string
  colorHex:    string
  photos:      string[]
  stock:       Record<string, number>
  variantType?: VariantType
  /** Preço por chave de stock (ex.: 50ml). */
  stockPrices?:      Record<string, number>
  /** Promo opcional por chave de stock. */
  stockPromoPrices?: Record<string, number>
}

/** Público-alvo de um produto (cadastro + vitrine). */
export type ProductAudience = 'feminine' | 'masculine' | 'unisex' | 'kids'

export type ProductAudienceConfidence = 'alta' | 'media' | 'baixa'

export const PRODUCT_AUDIENCE_OPTIONS: Array<{ value: ProductAudience; label: string }> = [
  { value: 'feminine',  label: 'Feminino' },
  { value: 'masculine', label: 'Masculino' },
  { value: 'unisex',    label: 'Unissex' },
  { value: 'kids',      label: 'Infantil' },
]

export function getProductAudienceLabel(audience: ProductAudience | null | undefined): string {
  if (!audience) return 'Não informado'
  return PRODUCT_AUDIENCE_OPTIONS.find(o => o.value === audience)?.label ?? audience
}

export interface Product {
  id:            string
  store_id:      string
  name:          string
  slug?:         string
  description:   string
  category:      string
  audience?:     ProductAudience | null
  price:         number
  promo_price:   number | null
  variants_json: ProductVariant[]
  catalog_axes?: CatalogAxes | null
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
  variant_id?: string
  name:       string
  size:       string
  color:      string
  qty:        number
  price:      number
  /** Foto da variante no pedido (quando disponível no checkout) */
  photo?:     string
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
  customer_email?:    string | null
  customer_cpf_enc?:  string | null
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
  payment_method?:    'PIX' | 'CARTAO' | 'OUTRO' | null
  coupon_code_applied?: string | null
  // Campos de pagamento integrado (separado de status logístico NOVO..ENTREGUE)
  payment_source?:            PaymentSource | null
  payment_status?:            PaymentStatus | null
  asaas_payment_id?:          string | null
  asaas_installment_id?:      string | null
  checkout_gross_value?:      number | null
  checkout_installment_count?: number | null
  checkout_installment_value?: number | null
  platform_fee_pct?:          number | null
  platform_fee_amount?:       number | null
  platform_fee_fixed?:        number | null
  net_value?:                 number | null
  checkout_url?:              string | null
  pix_qr_code?:               string | null
  pix_copy_paste?:            string | null
  asaas_split_status?:        AsaasSplitStatus | null
}

// ─── Vi Chat ──────────────────────────────────────────────────────────────────
export interface ViMessage {
  role:    'user' | 'assistant'
  content: string
}

export interface StoreContext {
  storeSlug?:       string
  whatsapp?:        string
  name:             string
  assistantName?:   string
  welcomeMessage?:  string | null
  assistantGender?: 'feminine' | 'masculine' | 'neutral'
  plan?:            PlanSlug
  freteInfo?:       string
  pagamentoInfo?:   string
  /** Perfil da loja para tom da Vi */
  genderFocus?:     GenderFocus
  ageGroup?:        AgeGroup
  segmentLabel?:    string
  products: Array<{
    id?:       string
    slug?:     string
    name:      string
    category:  string
    price:     number
    sizes:     string[]
    colors:    string[]
    inStock:   boolean
    productUrl?: string
  }>
}

/** Dicas opcionais no cadastro guiado (fotos + texto → IA). */
export type ProductAudienceHint = '' | GenderFocus | 'kids'

/** single = várias fotos do mesmo produto (cores); multi = 1 foto ≈ 1 produto */
export type ProductAnalysisMode = 'single' | 'multi'

export interface ProductAnalysisHints {
  mode?:            ProductAnalysisMode
  productCount?:    number
  pieceType?:       string
  audience?:        ProductAudienceHint
  colorsNote?:      string
  freeText?:        string
  /** O que muda entre fotos no modo single. */
  photoVariation?:  PhotoVariationHint
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const PRODUCT_CATEGORIES = [
  { value: 'vestido',  label: 'Vestidos' },
  { value: 'blusa',    label: 'Blusas' },
  { value: 'camiseta', label: 'Camisetas' },
  { value: 'calca',    label: 'Calças' },
  { value: 'bermuda',  label: 'Bermudas' },
  { value: 'shorts',   label: 'Shorts' },
  { value: 'conjunto', label: 'Conjuntos' },
  { value: 'saia',     label: 'Saias' },
  { value: 'moletom',  label: 'Moletons' },
  { value: 'casaco',   label: 'Casacos / jaquetas' },
  { value: 'infantil', label: 'Infantil' },
  { value: 'outro',    label: 'Outro' },
]

export const PRODUCT_CATEGORY_SLUGS = PRODUCT_CATEGORIES.map(c => c.value)

/** Rótulo para exibição: categorias padrão, depois customizadas da loja, senão o slug. */
export function getCategoryDisplayLabel(
  slug: string,
  customCategories?: CustomCategory[] | null
): string {
  const s = String(slug ?? '').trim()
  if (!s) return 'Outro'
  const fromStd = PRODUCT_CATEGORIES.find(c => c.value === s)?.label
  if (fromStd) return fromStd
  const fromCustom = customCategories?.find(c => c.value === s)?.label
  if (fromCustom) return fromCustom
  return s === 'outro' ? 'Outro' : s
}

/** Normaliza categoria vinda da IA para um slug conhecido (padrão ou customizado da loja). */
export function normalizeProductCategory(raw: string, customSlugs?: string[]): string {
  const t = String(raw ?? '').trim().toLowerCase()
  if (PRODUCT_CATEGORIES.some(c => c.value === t)) return t
  if (customSlugs?.some(s => s === t)) return t
  const synonyms: Record<string, string> = {
    camisa: 'camiseta', 't-shirt': 'camiseta', tshirt: 'camiseta', 't shirt': 'camiseta',
    jeans: 'calca', calça: 'calca', calças: 'calca',
    short: 'shorts',
    kids: 'infantil', criança: 'infantil', crianca: 'infantil',
    moletom: 'moletom', jaqueta: 'casaco',
  }
  return synonyms[t] ?? 'outro'
}

export const CLOTHING_SIZES = ['PP', 'P', 'M', 'G', 'GG', 'Único']
/** Alias legado — preferir CLOTHING_SIZES. */
export const SIZES = CLOTHING_SIZES

export const VOLUME_PRESETS = ['5ml', '10ml', '30ml', '50ml', '100ml', '200ml', 'Único']

const VOLUME_KEY_PATTERN = /\d+\s*ml/i

/** Chaves de stock para o grid admin conforme eixo. Preserva chaves extras existentes. */
export function stockKeysForAxes(
  stockAxis: StockAxis,
  existingStock?: Record<string, number> | null,
): string[] {
  const preset =
    stockAxis === 'volume' ? VOLUME_PRESETS
    : stockAxis === 'unique' ? ['Único']
    : CLOTHING_SIZES
  const extra = Object.keys(existingStock ?? {}).filter(k => !preset.includes(k))
  return [...preset, ...extra]
}

export function isVolumeStockKey(key: string): boolean {
  return VOLUME_KEY_PATTERN.test(String(key ?? '').trim())
}

// ─── Payments / Asaas ─────────────────────────────────────────────────────────
export type PaymentSource = 'WHATSAPP' | 'CHECKOUT' | 'PDV'

export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'FAILED'

export type AsaasOnboardingStatus =
  | 'PENDING'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'

export type SubscriptionStatus =
  | 'TRIAL'
  | 'ACTIVE'
  | 'OVERDUE'
  | 'CANCELLED'

export type AsaasSplitStatus =
  | 'PENDING'
  | 'DONE'
  | 'CANCELLED'
  | 'REFUSED'

export type VariantType = 'cor' | 'modelo' | 'tamanho' | 'estampa' | 'material'

export interface InstallmentQuote {
  faixaTaxa:          number  // ex: 0.065
  totalComJuros:      number  // ex: 639.00
  installmentValue:   number  // ex: 106.50
  platformTakePct:    number  // ex: 6.5 (percentual sobre valor cobrado, sem taxa fixa)
  merchantSharePct:   number  // ex: 93.5
  platformFeeAmount:  number  // take rate percentual em R$
  platformFeeFixed:   number  // taxa fixa R$0,99
  netValue:           number  // líquido estimado para o lojista
}
