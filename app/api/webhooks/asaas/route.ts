import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { logServerError } from '@/lib/logger'
import {
  onAccountStatus,
  onPaymentEvent,
  onPaymentSplitDivergenceBlock,
  onPaymentSplitDivergenceBlockFinished,
} from '@/lib/asaas/webhook-handlers'

// Retorna sempre 200 — 5xx causaria retry infinito pelo Asaas
const ok = () => NextResponse.json({ received: true }, { status: 200 })

export async function POST(req: NextRequest) {
  // 1. Validar token
  const token = req.headers.get('asaas-access-token')
  if (!process.env.ASAAS_WEBHOOK_TOKEN || token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    // Se o token não está configurado ainda, loga mas aceita (setup inicial)
    if (process.env.ASAAS_WEBHOOK_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return ok()
  }

  const eventId   = payload.id as string | undefined
  const eventType = payload.event as string | undefined

  if (!eventId) return ok()

  // 2. Deduplicar
  try {
    const result = await sql`
      INSERT INTO webhook_events_asaas (event_id, event_type, payload)
      VALUES (${eventId}, ${eventType ?? null}, ${JSON.stringify(payload)}::jsonb)
      ON CONFLICT (event_id) DO NOTHING
    `
    // rowCount === 0 significa que o evento já foi processado
    if ((result as unknown as { count: number }).count === 0) {
      return ok()
    }
  } catch (err) {
    logServerError('[webhook/asaas] INSERT dedup', err)
    return ok()
  }

  // 3. Rotear para handler correto
  try {
    switch (eventType) {
      case 'ACCOUNT_STATUS':
        await onAccountStatus(payload)
        break

      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_REFUNDED':
        await onPaymentEvent(payload)
        break

      case 'PAYMENT_SPLIT_DIVERGENCE_BLOCK':
        await onPaymentSplitDivergenceBlock(payload)
        break

      case 'PAYMENT_SPLIT_DIVERGENCE_BLOCK_FINISHED':
        await onPaymentSplitDivergenceBlockFinished(payload)
        break

      default:
        // Evento não tratado — apenas registrado na tabela de dedup
        break
    }
  } catch (err) {
    logServerError(`[webhook/asaas] handler ${eventType}`, err)
    // Não re-lança: retorna 200 para evitar retry infinito
  }

  return ok()
}
