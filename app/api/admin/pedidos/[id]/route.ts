import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSessionSafe } from '@/lib/auth'
import { logServerError } from '@/lib/logger'
import { quoteUpdateSchema } from '@/lib/validations'
import { validationErrorResponse } from '@/lib/api-errors'
import {
  calcOrderTotalFromItems,
  isQuoteOrder,
  orderItemsToCartItems,
} from '@/lib/orders'
import {
  decrementStockForOrder,
  incrementStockForOrder,
  OrderValidationError,
} from '@/lib/order-pricing'
import type { Order, OrderItem } from '@/types'
export { dynamic } from '@/lib/route-dynamic'

async function loadOrder(id: string, storeId: string): Promise<Order | null> {
  const rows = await sql`
    SELECT * FROM orders WHERE id = ${id} AND store_id = ${storeId} LIMIT 1
  `
  return (rows[0] as Order | undefined) ?? null
}

/** Atualiza itens e observações de um orçamento (WhatsApp, ainda não pago). */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionSafe()
  if (!session?.storeId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = quoteUpdateSchema.safeParse(body)
  if (!parsed.success) {
    const first =
      Object.values(parsed.error.flatten().fieldErrors).flat()[0]
      ?? parsed.error.issues[0]?.message
    return validationErrorResponse(first)
  }

  try {
    const order = await loadOrder(params.id, session.storeId)
    if (!order) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    if (!isQuoteOrder(order)) {
      return NextResponse.json({ error: 'Só é possível editar orçamentos em aberto.' }, { status: 400 })
    }

    const items = parsed.data.items as OrderItem[]
    const subtotal = calcOrderTotalFromItems(items)
    const discountTotal = Number(order.discount_total ?? 0)
    const totalFinal = Math.max(0, Number((subtotal - discountTotal).toFixed(2)))

    await sql`
      UPDATE orders SET
        items_json   = ${JSON.stringify(items)}::jsonb,
        subtotal     = ${subtotal},
        total        = ${totalFinal},
        total_final  = ${totalFinal},
        notes        = ${parsed.data.notes ?? order.notes ?? ''}
      WHERE id = ${params.id} AND store_id = ${session.storeId}
    `

    return NextResponse.json({ ok: true, subtotal, total: totalFinal })
  } catch (error) {
    logServerError('[PATCH /api/admin/pedidos/[id]]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/** Confirma pagamento do orçamento e baixa estoque. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionSafe()
  if (!session?.storeId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let action = 'confirm_payment'
  try {
    const body = await req.json()
    if (body?.action) action = String(body.action)
  } catch {
    /* body opcional */
  }

  if (action !== 'confirm_payment') {
    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  }

  try {
    const order = await loadOrder(params.id, session.storeId)
    if (!order) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    if (!isQuoteOrder(order)) {
      return NextResponse.json({ error: 'Este pedido não é um orçamento em aberto.' }, { status: 400 })
    }

    const cartItems = orderItemsToCartItems(order.items_json ?? [])
    if (cartItems.length === 0) {
      return NextResponse.json({ error: 'Orçamento sem itens válidos.' }, { status: 400 })
    }

    try {
      await decrementStockForOrder(session.storeId, cartItems)
    } catch (e) {
      if (e instanceof OrderValidationError) {
        return NextResponse.json(
          { error: 'Estoque insuficiente para um ou mais itens. Ajuste o orçamento antes de confirmar.' },
          { status: 422 },
        )
      }
      throw e
    }

    await sql`
      UPDATE orders SET
        status         = 'CONFIRMADO'::order_status,
        payment_status = 'CONFIRMED'
      WHERE id = ${params.id} AND store_id = ${session.storeId}
    `

    return NextResponse.json({ ok: true, status: 'CONFIRMADO' })
  } catch (error) {
    logServerError('[POST /api/admin/pedidos/[id]]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/** Cancela pedido confirmado e devolve estoque quando o pagamento já tinha sido confirmado. */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionSafe()
  if (!session?.storeId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const order = await loadOrder(params.id, session.storeId)
    if (!order) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })

    if (order.status === 'CONFIRMADO' && order.payment_status === 'CONFIRMED') {
      const cartItems = orderItemsToCartItems(order.items_json ?? [])
      if (cartItems.length > 0) {
        await incrementStockForOrder(session.storeId, cartItems)
      }
    }

    await sql`
      UPDATE orders SET status = 'CANCELADO'::order_status
      WHERE id = ${params.id} AND store_id = ${session.storeId}
    `

    return NextResponse.json({ ok: true, status: 'CANCELADO' })
  } catch (error) {
    logServerError('[DELETE /api/admin/pedidos/[id]]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
