import { sql } from '@/lib/db'
import { logServerError } from '@/lib/logger'

interface AccountStatusPayload {
  account?: {
    id?:     string
    status?: string
  }
  [key: string]: unknown
}

interface PaymentEventPayload {
  payment?: {
    id?:     string
    status?: string
  }
  [key: string]: unknown
}

export async function onAccountStatus(payload: AccountStatusPayload): Promise<void> {
  const accountId = payload.account?.id
  const status    = payload.account?.status

  if (!accountId || !status) {
    logServerError('[onAccountStatus] payload sem accountId ou status', payload)
    return
  }

  // Mapeamento de status Asaas → nosso enum
  const statusMap: Record<string, string> = {
    ACTIVE:     'APPROVED',
    APPROVED:   'APPROVED',
    REPROVED:   'REJECTED',
    REJECTED:   'REJECTED',
    AWAITING:   'AWAITING_APPROVAL',
    ANALYSIS:   'AWAITING_APPROVAL',
    INACTIVE:   'PENDING',
    PENDING:    'PENDING',
  }

  const mappedStatus = statusMap[status] ?? 'PENDING'
  const approvedAt   = mappedStatus === 'APPROVED' ? new Date().toISOString() : null

  await sql`
    UPDATE stores
    SET
      asaas_onboarding_status = ${mappedStatus},
      asaas_approved_at       = ${approvedAt}
    WHERE asaas_account_id = ${accountId}
  `
}

export async function onPaymentEvent(payload: PaymentEventPayload): Promise<void> {
  const paymentId = payload.payment?.id
  const eventType = (payload as Record<string, unknown>).event as string | undefined

  if (!paymentId) {
    logServerError('[onPaymentEvent] payload sem payment.id', payload)
    return
  }

  if (eventType === 'PAYMENT_CONFIRMED' || eventType === 'PAYMENT_RECEIVED') {
    await sql`
      UPDATE orders
      SET
        payment_status    = 'CONFIRMED',
        asaas_split_status = 'DONE'
      WHERE asaas_payment_id = ${paymentId}
    `
    return
  }

  if (eventType === 'PAYMENT_REFUNDED') {
    await sql`
      UPDATE orders
      SET
        payment_status    = 'FAILED',
        asaas_split_status = 'CANCELLED'
      WHERE asaas_payment_id = ${paymentId}
    `
    return
  }
}

export async function onPaymentSplitDivergenceBlock(payload: PaymentEventPayload): Promise<void> {
  const paymentId = payload.payment?.id
  logServerError('[SPLIT_DIVERGENCE_BLOCK] Divergência no split detectada', { paymentId })
  // Prazo: 2 dias úteis para ajuste antes do cancelamento automático pelo Asaas
}

export async function onPaymentSplitDivergenceBlockFinished(payload: PaymentEventPayload): Promise<void> {
  const paymentId = payload.payment?.id
  logServerError('[SPLIT_DIVERGENCE_BLOCK_FINISHED] Divergência de split finalizada', { paymentId })
}
