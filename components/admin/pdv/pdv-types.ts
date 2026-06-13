export interface PdvCartItem {
  productId: string
  variantId: string
  name:      string
  color:     string
  size:      string
  price:     number
  qty:       number
}

export type PdvDiscType = 'pct' | 'fixed'
