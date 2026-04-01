'use server'

import { sql }           from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import type { OrderStatus, StoreSettings, CustomCategory } from '@/types'
import { PRODUCT_CATEGORY_SLUGS } from '@/types'

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
  if (slug) revalidatePath(`/${slug}`)
}

export async function addCustomCategory(label: string) {
  const session = await getSession()
  if (!session?.storeId) throw new Error('Não autorizado')
  const trimmed = String(label ?? '').trim()
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

  list.push({ value, label: trimmed })
  const merged: StoreSettings = { ...current, customCategories: list }

  await sql`
    UPDATE stores SET settings_json = ${JSON.stringify(merged)}::jsonb
    WHERE id = ${session.storeId}
  `
  await revalidateStorePaths(session.storeId)
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

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  await sql`UPDATE orders SET status = ${status}::order_status WHERE id = ${orderId}`
  revalidatePath('/admin/pedidos')
  revalidatePath('/admin/dashboard')
}

export async function toggleProductActive(productId: string, active: boolean) {
  await sql`UPDATE products SET active = ${!active} WHERE id = ${productId}`
  revalidatePath('/admin/produtos')
}

export async function deleteProduct(productId: string) {
  await sql`DELETE FROM products WHERE id = ${productId}`
  revalidatePath('/admin/produtos')
}
