import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import type { OrderStatus } from '@/types'

async function getParams(params: { id: string } | Promise<{ id: string }>) {
  return typeof (params as Promise<{ id: string }>).then === 'function'
    ? await (params as Promise<{ id: string }>)
    : (params as { id: string })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await getParams(params)
  const { status }: { status: OrderStatus } = await req.json()
  if (!status) return NextResponse.json({ error: 'status required' }, { status: 400 })

  const result = await sql`
    UPDATE orders SET status = ${status}::order_status
    WHERE id = ${id} AND store_id = ${session.storeId}
  `
  if (result.length === 0 && (await sql`SELECT 1 FROM orders WHERE id = ${id}`).length > 0) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await getParams(params)
  const body = await req.json()
  if (body.recovery_sent_at) {
    await sql`
      UPDATE orders SET recovery_sent_at = NOW()
      WHERE id = ${id} AND store_id = ${session.storeId}
    `
  }
  return NextResponse.json({ ok: true })
}
