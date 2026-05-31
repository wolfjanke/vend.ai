import { sql } from '@/lib/db'
import type { CartItem, Product, ProductVariant } from '@/types'

const PRICE_TOLERANCE = 0.01

export type OrderLineInput = {
  product_id: string
  variant_id: string
  name?:      string
  size:       string
  color?:     string
  qty:        number
  price?:     number
  photo?:     string
}

export class OrderValidationError extends Error {
  constructor(message = 'ORDER_INVALID') {
    super(message)
    this.name = 'OrderValidationError'
  }
}

function unitPrice(product: Product): number {
  const p = product.promo_price != null ? Number(product.promo_price) : Number(product.price)
  return Math.max(0, Number(p.toFixed(2)))
}

function findVariant(product: Product, variantId: string): ProductVariant | undefined {
  const variants = product.variants_json ?? []
  return variants.find(v => v.id === variantId)
}

function stockForSize(variant: ProductVariant, size: string): number {
  const stock = variant.stock ?? {}
  return Number(stock[size] ?? 0)
}

/**
 * Valida itens contra o catálogo da loja e retorna linhas com preço do banco.
 */
export async function resolveOrderLines(
  storeId: string,
  inputs: OrderLineInput[],
): Promise<CartItem[]> {
  if (!inputs.length) throw new OrderValidationError()

  const productIdSet = new Set(inputs.map(i => i.product_id))
  const rows = await sql`
    SELECT * FROM products
    WHERE store_id = ${storeId} AND active = true
  `
  const byId = new Map<string, Product>()
  for (const row of rows) {
    const id = String(row.id)
    if (productIdSet.has(id)) byId.set(id, row as Product)
  }

  const resolved: CartItem[] = []

  for (const input of inputs) {
    const product = byId.get(input.product_id)
    if (!product) throw new OrderValidationError('PRODUCT')

    const variant = findVariant(product, input.variant_id)
    if (!variant) throw new OrderValidationError('VARIANT')

    const size = String(input.size).trim()
    if (!size || stockForSize(variant, size) < input.qty) {
      throw new OrderValidationError('STOCK')
    }

    const price = unitPrice(product)
    if (input.price != null && Math.abs(input.price - price) > PRICE_TOLERANCE) {
      throw new OrderValidationError('PRICE')
    }

    const photo = input.photo ?? variant.photos?.[0]
    resolved.push({
      product_id: product.id,
      variant_id: variant.id,
      name:       product.name,
      size,
      color:      input.color?.trim() || variant.color,
      qty:        input.qty,
      price,
      photo,
      description: product.description?.trim() || undefined,
    })
  }

  return resolved
}

export function amountsMatch(a: number, b: number, tolerance = PRICE_TOLERANCE): boolean {
  return Math.abs(a - b) <= tolerance
}

/** Decrementa estoque após validação das linhas (mesma loja). */
export async function decrementStockForOrder(storeId: string, items: CartItem[]): Promise<void> {
  for (const item of items) {
    const rows = await sql`
      SELECT variants_json FROM products
      WHERE id = ${item.product_id} AND store_id = ${storeId} AND active = true
      LIMIT 1
    `
    const row = rows[0] as { variants_json: ProductVariant[] } | undefined
    if (!row) throw new OrderValidationError('STOCK')

    const variants = (row.variants_json ?? []).map(v => ({
      ...v,
      stock: { ...(v.stock ?? {}) },
    }))
    const vi = variants.findIndex(v => v.id === item.variant_id)
    if (vi < 0) throw new OrderValidationError('STOCK')

    const current = Number(variants[vi].stock[item.size] ?? 0)
    if (current < item.qty) throw new OrderValidationError('STOCK')
    variants[vi].stock[item.size] = current - item.qty

    await sql`
      UPDATE products SET variants_json = ${JSON.stringify(variants)}::jsonb
      WHERE id = ${item.product_id} AND store_id = ${storeId}
    `
  }
}
