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

export interface StoreSettings {
  theme?:            'dark' | 'light'
  welcomeMessage?:   string
  inactivityDelay?:  number
  freteInfo?:        string
  pagamentoInfo?:    string
  bannerMessages?:   BannerMessage[]
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
  { value: 'calca',    label: '👖 Calças' },
  { value: 'conjunto', label: '✨ Conjuntos' },
  { value: 'saia',     label: '🌸 Saias' },
  { value: 'outro',    label: '📦 Outro' },
]

export const SIZES = ['PP', 'P', 'M', 'G', 'GG', 'Único']
