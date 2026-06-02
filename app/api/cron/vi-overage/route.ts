import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { logServerError } from '@/lib/logger'
import { chargeViOverage } from '@/lib/payments/subscriptions'
import { getWolfHubApiKey } from '@/lib/payments/config'
import { isPaidPlan, type PlanSlug } from '@/lib/plans'

function cronAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return process.env.NODE_ENV !== 'production'
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

export async function POST(req: NextRequest) {
  if (!cronAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!getWolfHubApiKey()) {
    return NextResponse.json({ error: 'Pagamentos não configurados', skipped: true })
  }

  try {
    const stores = await sql`
      SELECT id, plan, vi_overage_messages
      FROM stores
      WHERE vi_overage_messages > 0
        AND plan IN ('starter', 'pro', 'loja', 'enterprise')
    `

    const results: Array<{ storeId: string; charged: boolean; amountCents: number }> = []

    for (const row of stores) {
      const storeId = row.id as string
      const plan = row.plan as PlanSlug
      if (!isPaidPlan(plan)) continue
      try {
        const r = await chargeViOverage(storeId)
        results.push({ storeId, ...r })
      } catch (err) {
        logServerError(`[cron/vi-overage] store ${storeId}`, err)
      }
    }

    return NextResponse.json({ ok: true, processed: results.length, results })
  } catch (err) {
    logServerError('[cron/vi-overage]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
