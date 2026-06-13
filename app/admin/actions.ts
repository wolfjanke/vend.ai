'use server'

import { sql }           from '@/lib/db'
import { revalidatePath, revalidateTag } from 'next/cache'
import { getSession } from '@/lib/auth'
import type { OrderStatus, StoreSettings, CustomCategory } from '@/types'
import {
  canRestoreStockOnCancel,
  isQuoteOrder,
  orderItemsToCartItems,
} from '@/lib/orders'
import { incrementStockForOrder } from '@/lib/order-pricing'
import { PRODUCT_CATEGORY_SLUGS } from '@/types'
import { stripEmojis } from '@/lib/strip-emoji'
import { normalizeCategoryEmoji } from '@/lib/category-nav'

function slugifyLabel(label: string): string {
  const base = label
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return base || 'categoria'
}

function uniqueSlug(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}-${n}`)) n += 1
  return `${base}-${n}`
}

async function revalidateStorePaths(storeId: string) {
  const rows = await sql`SELECT slug FROM stores WHERE id = ${storeId} LIMIT 1`
  const slug = rows[0]?.slug as string | undefined
  revalidatePath('/admin/categorias')
  revalidatePath('/admin/produtos')
  revalidatePath('/admin/produtos/novo')
  if (slug) {
    revalidateTag(`store-${slug}`)
    revalidatePath(`/${slug}`)
    revalidatePath(`/${slug}`, 'layout')
    revalidatePath(`/${slug}/categoria`, 'layout')
  }
}

export async function addCustomCategory(label: string, emoji?: string): Promise<CustomCategory> {
  const session = await getSession()
  if (!session?.storeId) throw new Error('Não autorizado')
  const trimmed = stripEmojis(String(label ?? '')).trim()
  if (!trimmed) throw new Error('Digite o nome da categoria')
  if (trimmed.length > 80) throw new Error('Nome muito longo (máx. 80 caracteres)')

  const storeRows = await sql`SELECT settings_json FROM stores WHERE id = ${session.storeId} LIMIT 1`
  const current = (storeRows[0]?.settings_json as StoreSettings | null) ?? {}
  const list: CustomCategory[] = Array.isArray(current.customCategories) ? [...current.customCategories] : []

  if (list.some(c => c.label.toLowerCase() === trimmed.toLowerCase())) {
    throw new Error('Já existe uma categoria com esse nome')
  }

  let base = slugifyLabel(trimmed)
  if (PRODUCT_CATEGORY_SLUGS.includes(base)) {
    throw new Error('Esse nome corresponde a uma categoria já disponível na lista padrão.')
  }

  const taken = new Set<string>([...PRODUCT_CATEGORY_SLUGS, ...list.map(c => c.value)])
  const value = uniqueSlug(base, taken)

  const added: CustomCategory = {
    value,
    label: trimmed,
    ...(normalizeCategoryEmoji(emoji ?? '') ? { emoji: normalizeCategoryEmoji(emoji ?? '') } : {}),
  }
  list.push(added)
  const merged: StoreSettings = { ...current, customCategories: list }

  await sql`
    UPDATE stores SET settings_json = ${JSON.stringify(merged)}::jsonb
    WHERE id = ${session.storeId}
  `
  await revalidateStorePaths(session.storeId)
  return added
}

export async function removeCustomCategory(value: string) {
  const session = await getSession()
  if (!session?.storeId) throw new Error('Não autorizado')
  const v = String(value ?? '').trim()
  if (!v) throw new Error('Categoria inválida')

  const storeRows = await sql`SELECT settings_json FROM stores WHERE id = ${session.storeId} LIMIT 1`
  const current = (storeRows[0]?.settings_json as StoreSettings | null) ?? {}
  const list: CustomCategory[] = Array.isArray(current.customCategories) ? current.customCategories : []
  const next = list.filter(c => c.value !== v)
  if (next.length === list.length) throw new Error('Categoria não encontrada')

  const merged: StoreSettings = { ...current, customCategories: next }

  await sql`
    UPDATE stores SET settings_json = ${JSON.stringify(merged)}::jsonb
    WHERE id = ${session.storeId}
  `
  await revalidateStorePaths(session.storeId)
}

export async function updateCustomCategory(
  value: string,
  patch: { emoji?: string | null; imageUrl?: string | null },
): Promise<CustomCategory> {
  const session = await getSession()
  if (!session?.storeId) throw new Error('Não autorizado')
  const v = String(value ?? '').trim()
  if (!v) throw new Error('Categoria inválida')

  const storeRows = await sql`SELECT settings_json FROM stores WHERE id = ${session.storeId} LIMIT 1`
  const current = (storeRows[0]?.settings_json as StoreSettings | null) ?? {}
  const list: CustomCategory[] = Array.isArray(current.customCategories) ? [...current.customCategories] : []
  const idx = list.findIndex(c => c.value === v)
  if (idx < 0) throw new Error('Categoria não encontrada')

  const prev = list[idx]
  const next: CustomCategory = { ...prev }

  if ('emoji' in patch) {
    const normalized = patch.emoji ? normalizeCategoryEmoji(patch.emoji) : undefined
    if (patch.emoji && !normalized) throw new Error('Use um único emoji válido.')
    if (normalized) next.emoji = normalized
    else delete next.emoji
  }

  if ('imageUrl' in patch) {
    const url = patch.imageUrl?.trim()
    if (url) next.imageUrl = url
    else delete next.imageUrl
  }

  list[idx] = next
  const merged: StoreSettings = { ...current, customCategories: list }

  await sql`
    UPDATE stores SET settings_json = ${JSON.stringify(merged)}::jsonb
    WHERE id = ${session.storeId}
  `
  await revalidateStorePaths(session.storeId)
  return next
}

export async function updateCategoryNavStyle(style: 'pills' | 'circles'): Promise<void> {
  const session = await getSession()
  if (!session?.storeId) throw new Error('Não autorizado')
  if (style !== 'pills' && style !== 'circles') throw new Error('Estilo inválido')

  const storeRows = await sql`SELECT settings_json FROM stores WHERE id = ${session.storeId} LIMIT 1`
  const current = (storeRows[0]?.settings_json as StoreSettings | null) ?? {}
  const merged: StoreSettings = { ...current, categoryNavStyle: style }

  await sql`
    UPDATE stores SET settings_json = ${JSON.stringify(merged)}::jsonb
    WHERE id = ${session.storeId}
  `
  await revalidateStorePaths(session.storeId)
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const session = await getSession()
  if (!session?.storeId) throw new Error('Não autorizado')

  const existing = await sql`
    SELECT status, payment_status, payment_source, items_json
    FROM orders
    WHERE id = ${orderId} AND store_id = ${session.storeId}
    LIMIT 1
  `
  const order = existing[0] as {
    status: OrderStatus
    payment_status: string | null
    payment_source: string | null
    items_json: unknown
  } | undefined
  if (!order) throw new Error('Pedido não encontrado')

  if (status === 'CONFIRMADO' && isQuoteOrder({
    status: order.status,
    payment_status: order.payment_status as never,
    payment_source: order.payment_source as never,
  })) {
    throw new Error('Use "Pagamento confirmado" para fechar orçamentos do WhatsApp.')
  }

  if (status === 'CANCELADO' && canRestoreStockOnCancel(order.status, order.payment_status as never)) {
    const items = orderItemsToCartItems((order.items_json ?? []) as never)
    if (items.length > 0) {
      await incrementStockForOrder(session.storeId, items)
    }
  }

  const rows = await sql`
    UPDATE orders SET status = ${status}::order_status
    WHERE id = ${orderId} AND store_id = ${session.storeId}
    RETURNING id
  `
  if (rows.length === 0) throw new Error('Pedido não encontrado')

  revalidatePath('/admin/pedidos')
  revalidatePath('/admin/dashboard')
}

export async function toggleProductActive(productId: string, active: boolean) {
  const session = await getSession()
  if (!session?.storeId) throw new Error('Não autorizado')

  const rows = await sql`
    UPDATE products SET active = ${!active}
    WHERE id = ${productId} AND store_id = ${session.storeId}
    RETURNING store_id
  `
  if (rows.length === 0) throw new Error('Produto não encontrado')

  revalidatePath('/admin/produtos')
  await revalidateStorePaths(session.storeId)
}

export async function deleteProduct(productId: string) {
  const session = await getSession()
  if (!session?.storeId) throw new Error('Não autorizado')

  const rows = await sql`
    DELETE FROM products WHERE id = ${productId} AND store_id = ${session.storeId}
    RETURNING store_id
  `
  if (rows.length === 0) throw new Error('Produto não encontrado')

  revalidatePath('/admin/produtos')
  await revalidateStorePaths(session.storeId)
}
