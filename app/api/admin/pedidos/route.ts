import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { requireSession } from '@/lib/require-session'

export async function GET(req: NextRequest) {
  const { session, unauthorized } = await requireSession()
  if (!session) return unauthorized!

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10) || 20))
  const offset = (page - 1) * limit

  const totalRows = await sql`SELECT COUNT(*)::int AS c FROM orders WHERE store_id = ${session.storeId}`
  const total = Number(totalRows[0]?.c ?? 0)

  const data = await sql`
    SELECT * FROM orders
    WHERE store_id = ${session.storeId}
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `

  return NextResponse.json({
    data,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  })
}
