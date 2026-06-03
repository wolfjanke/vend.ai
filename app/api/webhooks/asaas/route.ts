import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { logServerError } from '@/lib/logger'
import {
  onAccountStatus,
  onPaymentEvent,
  onPaymentEventWithSubscription,
  onPaymentOverdue,
  onPaymentSplitDivergenceBlock,
  onPaymentSplitDivergenceBlockFinished,
  onSplitCancelled,
  onSplitConfirmed,
  onSubscriptionCancelled,
  onSubscriptionCreated,
  onSubscriptionRenewed,
} from '@/lib/asaas/webhook-handlers'

export { dynamic } from '@/lib/route-dynamic'

const ok = () => NextResponse.json({ received: true }, { status: 200 })

const REPLAY_MAX_AGE_MS = 5 * 60 * 1000

function webhookTokenInvalid(req: NextRequest): boolean {
  const configured = process.env.ASAAS_WEBHOOK_TOKEN
  if (process.env.NODE_ENV === 'production' && !configured) {
    return true
  }
  if (!configured) return false
  const token = req.headers.get('asaas-access-token')
  return token !== configured
}

function extractEventTimestamp(payload: Record<string, unknown>): number | null {
  const payment = payload.payment as Record<string, unknown> | undefined
  const candidates = [
    payload.dateCreated,
    payment?.dateCreated,
    payment?.confirmedDate,
    payload.createdAt,
  ]
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) {
      const t = Date.parse(c)
      if (!Number.isNaN(t)) return t
    }
  }
  return null
}

function isReplay(payload: Record<string, unknown>): boolean {
  const ts = extractEventTimestamp(payload)
  if (ts == null) return false
  return Date.now() - ts > REPLAY_MAX_AGE_MS
}

export async function POST(req: NextRequest) {
  if (webhookTokenInvalid(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return ok()
  }

  if (isReplay(payload)) {
    logServerError('[webhook/asaas] evento rejeitado (replay)', { id: payload.id })
    return ok()
  }

  const eventId   = payload.id as string | undefined
  const eventType = payload.event as string | undefined

  if (!eventId) return ok()

  let isDuplicate = false
  try {
    const result = await sql`
      INSERT INTO webhook_events_asaas (event_id, event_type, payload)
      VALUES (${eventId}, ${eventType ?? null}, ${JSON.stringify(payload)}::jsonb)
      ON CONFLICT (event_id) DO NOTHING
      RETURNING event_id
    `
    isDuplicate = result.length === 0
  } catch (err) {
    logServerError('[webhook/asaas] INSERT dedup', err)
    return ok()
  }

  if (isDuplicate) {
    return ok()
  }

  try {
    switch (eventType) {
      case 'ACCOUNT_STATUS':
        await onAccountStatus(payload)
        break

      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED':
        await onPaymentEventWithSubscription(payload)
        break

      case 'PAYMENT_REFUNDED':
        await onPaymentEvent(payload)
        break

      case 'PAYMENT_OVERDUE':
        await onPaymentOverdue(payload)
        break

      case 'SUBSCRIPTION_CREATED':
        await onSubscriptionCreated(payload)
        break

      case 'SUBSCRIPTION_RENEWED':
        await onSubscriptionRenewed(payload)
        break

      case 'SUBSCRIPTION_CANCELLED':
      case 'SUBSCRIPTION_DELETED':
        await onSubscriptionCancelled(payload)
        break

      case 'SPLIT_CONFIRMED':
      case 'PAYMENT_SPLIT_DONE':
        await onSplitConfirmed(payload)
        break

      case 'SPLIT_CANCELLED':
        await onSplitCancelled(payload)
        break

      case 'PAYMENT_SPLIT_DIVERGENCE_BLOCK':
        await onPaymentSplitDivergenceBlock(payload)
        break

      case 'PAYMENT_SPLIT_DIVERGENCE_BLOCK_FINISHED':
        await onPaymentSplitDivergenceBlockFinished(payload)
        break

      default:
        break
    }
  } catch (err) {
    logServerError(`[webhook/asaas] handler ${eventType}`, err)
  }

  return ok()
}
