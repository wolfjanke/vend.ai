import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import type { CartItem } from '@/types'
import { generateOrderNumber } from '@/lib/whatsapp'

// Usa service role para criar pedidos de usuários não autenticados
const supabase = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { storeId, items, customerName, customerWhatsapp, notes }: {
      storeId:           string
      items:             CartItem[]
      customerName:      string
      customerWhatsapp:  string
      notes?:            string
    } = await req.json()

    if (!storeId || !items?.length || !customerName || !customerWhatsapp) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    const total    = items.reduce((s, c) => s + c.price * c.qty, 0)
    const orderNum = generateOrderNumber()

    const { data, error } = await supabase.from('orders').insert({
      store_id:          storeId,
      order_number:      orderNum,
      customer_name:     customerName,
      customer_whatsapp: customerWhatsapp.replace(/\D/g, ''),
      items_json:        items.map(i => ({
        product_id: i.product_id,
        name:       i.name,
        size:       i.size,
        color:      i.color,
        qty:        i.qty,
        price:      i.price,
      })),
      total,
      notes: notes ?? '',
      status: 'NOVO',
    }).select().single()

    if (error) throw new Error(error.message)

    return NextResponse.json({ orderNumber: orderNum, orderId: data.id })
  } catch (error) {
    console.error('[/api/pedidos]', error)
    return NextResponse.json({ error: 'Erro ao criar pedido' }, { status: 500 })
  }
}
