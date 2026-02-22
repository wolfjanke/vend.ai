'use server'

import { createClient }    from '@/lib/supabase'
import { revalidatePath }  from 'next/cache'
import type { OrderStatus } from '@/types'

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const supabase = createClient()
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/pedidos')
  revalidatePath('/admin/dashboard')
}

export async function toggleProductActive(productId: string, active: boolean) {
  const supabase = createClient()
  const { error } = await supabase
    .from('products')
    .update({ active: !active })
    .eq('id', productId)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/produtos')
}
