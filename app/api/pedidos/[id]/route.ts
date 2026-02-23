import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import type { OrderStatus } from '@/types'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { status }: { status: OrderStatus } = await req.json()
  if (!status) return NextResponse.json({ error: 'status required' }, { status: 400 })

  await sql`UPDATE orders SET status = ${status}::order_status WHERE id = ${params.id}`
  return NextResponse.json({ ok: true })
}
