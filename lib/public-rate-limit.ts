import {
  CHECKOUT_CREATE_IP_LIMIT,
  CHECKOUT_CREATE_IP_WINDOW_MS,
  CHECKOUT_CREATE_STORE_LIMIT,
  CHECKOUT_CREATE_STORE_WINDOW_MS,
  CHECKOUT_STATUS_LIMIT,
  CHECKOUT_STATUS_WINDOW_MS,
  LOJA_GET_IP_LIMIT,
  LOJA_GET_IP_WINDOW_MS,
} from '@/lib/rate-limit-config'
import { checkIpRateLimit, checkScopedRateLimit } from '@/lib/rate-limit-helpers'

export {
  CHECKOUT_CREATE_IP_LIMIT,
  CHECKOUT_CREATE_IP_WINDOW_MS,
  CHECKOUT_CREATE_STORE_LIMIT,
  CHECKOUT_CREATE_STORE_WINDOW_MS,
  CHECKOUT_STATUS_LIMIT,
  CHECKOUT_STATUS_WINDOW_MS,
  LOJA_GET_IP_LIMIT,
  LOJA_GET_IP_WINDOW_MS,
} from '@/lib/rate-limit-config'

export async function checkCheckoutStatusRateLimit(paymentId: string): Promise<boolean> {
  return checkScopedRateLimit(
    'checkout:status',
    paymentId,
    CHECKOUT_STATUS_LIMIT,
    CHECKOUT_STATUS_WINDOW_MS,
  )
}

export async function checkLojaGetIpRateLimit(ip: string): Promise<boolean> {
  return checkIpRateLimit('loja', ip, LOJA_GET_IP_LIMIT, LOJA_GET_IP_WINDOW_MS)
}

export async function checkCheckoutCreateIpRateLimit(ip: string): Promise<boolean> {
  return checkIpRateLimit(
    'checkout',
    ip,
    CHECKOUT_CREATE_IP_LIMIT,
    CHECKOUT_CREATE_IP_WINDOW_MS,
  )
}

export async function checkCheckoutCreateStoreRateLimit(slug: string): Promise<boolean> {
  return checkScopedRateLimit(
    'checkout:store',
    slug,
    CHECKOUT_CREATE_STORE_LIMIT,
    CHECKOUT_CREATE_STORE_WINDOW_MS,
  )
}
