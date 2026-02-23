'use server'

import { sql }           from '@/lib/db'
import { revalidatePath } from 'next/cache'
import type { OrderStatus } from '@/types'

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  await sql`UPDATE orders SET status = ${status}::order_status WHERE id = ${orderId}`
  revalidatePath('/admin/pedidos')
  revalidatePath('/admin/dashboard')
}

export async function toggleProductActive(productId: string, active: boolean) {
  await sql`UPDATE products SET active = ${!active} WHERE id = ${productId}`
  revalidatePath('/admin/produtos')
}
