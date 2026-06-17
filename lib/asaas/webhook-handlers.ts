import { sql } from '@/lib/db'
import { logServerError } from '@/lib/logger'
import { sendOrderConfirmationEmail } from '@/lib/email/send-order-confirmation'
import { sendMerchantOrderPaidEmail } from '@/lib/email/send-merchant-order-paid'
import { decrementStockForOrder } from '@/lib/order-pricing'
import type { CartItem, OrderItem } from '@/types'

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
    const updated = await sql`
      UPDATE orders
      SET
        payment_status     = 'CONFIRMED',
        status             = 'CONFIRMADO',
        asaas_split_status = 'DONE'
      WHERE asaas_payment_id = ${paymentId}
        AND (payment_status IS NULL OR payment_status <> 'CONFIRMED')
      RETURNING
        id, order_number, customer_name, customer_email, customer_whatsapp,
        total, net_value, store_id, payment_source, payment_method,
        checkout_installment_count, items_json
    `

    if (updated.length === 0) return

    const row = updated[0] as {
      id: string
      order_number: string
      customer_name: string
      customer_email: string | null
      customer_whatsapp: string
      total: number
      net_value: number | null
      store_id: string
      payment_source: string | null
      payment_method: string | null
      checkout_installment_count: number | null
      items_json: OrderItem[]
    }

    if (row.payment_source === 'CHECKOUT') {
      const items = (row.items_json ?? []) as OrderItem[]
      const cartItems: CartItem[] = items
        .filter(i => i.product_id && i.variant_id)
        .map(i => ({
          product_id: i.product_id,
          variant_id: i.variant_id!,
          name:       i.name,
          size:       i.size,
          color:      i.color,
          qty:        i.qty,
          price:      i.price,
          photo:      i.photo,
        }))

      if (cartItems.length > 0) {
        try {
          await decrementStockForOrder(row.store_id, cartItems)
        } catch (err) {
          logServerError('[onPaymentEvent] decrementStockForOrder', err)
        }
      }
    }

    const storeRows = await sql`
      SELECT name, slug, owner_email FROM stores WHERE id = ${row.store_id} LIMIT 1
    `
    const store = storeRows[0] as { name: string; slug: string; owner_email: string | null } | undefined
    if (!store) return

    if (row.payment_source === 'CHECKOUT') {
      const customerEmail = row.customer_email?.trim()
      if (customerEmail) {
        void sendOrderConfirmationEmail({
          to:           customerEmail,
          customerName: row.customer_name,
          storeName:    store.name,
          storeSlug:    store.slug,
          orderNumber:  row.order_number,
          total:        Number(row.total),
        }).catch(err => logServerError('[onPaymentEvent] order confirmation email', err))
      }

      const ownerEmail = store.owner_email?.trim()
      if (ownerEmail) {
        void sendMerchantOrderPaidEmail({
          to:            ownerEmail,
          storeName:     store.name,
          orderNumber:   row.order_number,
          orderId:       row.id,
          customerName:  row.customer_name,
          customerPhone: row.customer_whatsapp,
          total:         Number(row.total),
          netValue:      row.net_value != null ? Number(row.net_value) : null,
          paymentMethod: row.payment_method,
          installments:  row.checkout_installment_count,
          items:         (row.items_json ?? []) as OrderItem[],
        }).catch(err => logServerError('[onPaymentEvent] merchant order email', err))
      } else {
        logServerError('[onPaymentEvent] owner_email ausente — notificação ao lojista ignorada', {
          storeId: row.store_id,
          orderId: row.id,
        })
      }
    }

    return
  }

  if (eventType === 'PAYMENT_REFUNDED') {
    await sql`
      UPDATE orders
      SET
        payment_status     = 'FAILED',
        asaas_split_status = 'CANCELLED'
      WHERE asaas_payment_id = ${paymentId}
        AND (payment_status IS NULL OR payment_status NOT IN ('FAILED', 'CANCELLED'))
    `
  }
}

export async function onPaymentSplitDivergenceBlock(payload: PaymentEventPayload): Promise<void> {
  const paymentId = payload.payment?.id
  logServerError('[SPLIT_DIVERGENCE_BLOCK] Divergência no split detectada', { paymentId })
}

export async function onPaymentSplitDivergenceBlockFinished(payload: PaymentEventPayload): Promise<void> {
  const paymentId = payload.payment?.id
  logServerError('[SPLIT_DIVERGENCE_BLOCK_FINISHED] Divergência de split finalizada', { paymentId })
}

interface SubscriptionPayload {
  subscription?: {
    id?: string
    externalReference?: string
    status?: string
    nextDueDate?: string
  }
  payment?: {
    id?: string
    subscription?: string
    externalReference?: string
  }
  split?: {
    id?: string
    status?: string
  }
  [key: string]: unknown
}

function storeIdFromPayload(payload: SubscriptionPayload): string | null {
  const subRef = payload.subscription?.externalReference
  if (subRef && typeof subRef === 'string') return subRef
  const payRef = payload.payment?.externalReference
  if (payRef && typeof payRef === 'string' && !payRef.includes(':')) return payRef
  return null
}

export async function onSubscriptionCreated(payload: SubscriptionPayload): Promise<void> {
  const storeId = storeIdFromPayload(payload)
  const subId = payload.subscription?.id
  if (!storeId || !subId) return

  await sql`
    UPDATE stores SET
      asaas_subscription_id = ${subId},
      subscription_status = COALESCE(subscription_status, 'ACTIVE'),
      subscription_started_at = COALESCE(subscription_started_at, NOW())
    WHERE id = ${storeId}
  `
}

export async function onSubscriptionRenewed(payload: SubscriptionPayload): Promise<void> {
  const storeId = storeIdFromPayload(payload)
  const nextDue = payload.subscription?.nextDueDate
  if (!storeId) return

  const endsAt = nextDue ? new Date(nextDue).toISOString() : null

  await sql`
    UPDATE stores SET
      subscription_status = 'ACTIVE',
      subscription_ends_at = COALESCE(${endsAt}, subscription_ends_at)
    WHERE id = ${storeId}
  `

  try {
    const { chargeViOverage } = await import('@/lib/payments/subscriptions')
    await chargeViOverage(storeId)
  } catch (err) {
    logServerError('[onSubscriptionRenewed] chargeViOverage', err)
  }
}

export async function onSubscriptionCancelled(payload: SubscriptionPayload): Promise<void> {
  const storeId = storeIdFromPayload(payload)
  if (!storeId) return

  await sql`
    UPDATE stores SET
      plan = 'free',
      asaas_subscription_id = NULL,
      subscription_status = 'CANCELLED',
      subscription_ends_at = NULL,
      trial_ends_at = NULL
    WHERE id = ${storeId}
  `
}

export async function onPaymentOverdue(payload: SubscriptionPayload): Promise<void> {
  const storeId = storeIdFromPayload(payload)
  const subId = payload.payment?.subscription
  if (!storeId && !subId) return

  if (storeId) {
    await sql`
      UPDATE stores SET subscription_status = 'OVERDUE'
      WHERE id = ${storeId}
    `
    return
  }

  if (subId) {
    await sql`
      UPDATE stores SET subscription_status = 'OVERDUE'
      WHERE asaas_subscription_id = ${subId}
    `
  }
}

export async function onPaymentEventWithSubscription(payload: PaymentEventPayload & SubscriptionPayload): Promise<void> {
  await onPaymentEvent(payload)

  const subId = payload.payment?.subscription
  const storeId = storeIdFromPayload(payload)
  if (!subId && !storeId) return

  if (storeId) {
    await sql`
      UPDATE stores SET
        subscription_status = 'ACTIVE',
        trial_ends_at = CASE WHEN subscription_status = 'TRIAL' THEN NULL ELSE trial_ends_at END
      WHERE id = ${storeId}
        AND subscription_status IN ('TRIAL', 'OVERDUE')
    `
  } else if (subId) {
    await sql`
      UPDATE stores SET
        subscription_status = 'ACTIVE',
        trial_ends_at = CASE WHEN subscription_status = 'TRIAL' THEN NULL ELSE trial_ends_at END
      WHERE asaas_subscription_id = ${subId}
        AND subscription_status IN ('TRIAL', 'OVERDUE')
    `
  }
}

export async function onSplitConfirmed(payload: SubscriptionPayload): Promise<void> {
  const paymentId = payload.payment?.id
  if (!paymentId) return

  await sql`
    UPDATE orders SET asaas_split_status = 'DONE'
    WHERE asaas_payment_id = ${paymentId}
      AND (asaas_split_status IS NULL OR asaas_split_status <> 'DONE')
  `
}

export async function onSplitCancelled(payload: SubscriptionPayload): Promise<void> {
  const paymentId = payload.payment?.id
  if (!paymentId) return

  await sql`
    UPDATE orders SET asaas_split_status = 'CANCELLED'
    WHERE asaas_payment_id = ${paymentId}
      AND (asaas_split_status IS NULL OR asaas_split_status NOT IN ('CANCELLED', 'REFUSED'))
  `
}
