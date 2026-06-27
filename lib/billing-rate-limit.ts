import {
  PDV_LINK_POST_LIMIT,
  PDV_LINK_POST_WINDOW_MS,
  SUBACCOUNT_POST_LIMIT,
  SUBACCOUNT_POST_WINDOW_MS,
  SUBSCRIPTION_POST_LIMIT,
  SUBSCRIPTION_POST_WINDOW_MS,
} from '@/lib/rate-limit-config'
import { checkStoreRateLimit } from '@/lib/rate-limit-helpers'

export {
  PDV_LINK_POST_LIMIT,
  PDV_LINK_POST_WINDOW_MS,
  SUBACCOUNT_POST_LIMIT,
  SUBACCOUNT_POST_WINDOW_MS,
  SUBSCRIPTION_POST_LIMIT,
  SUBSCRIPTION_POST_WINDOW_MS,
} from '@/lib/rate-limit-config'

export async function checkSubscriptionPostRateLimit(storeId: string): Promise<boolean> {
  return checkStoreRateLimit(
    'billing:subscription',
    storeId,
    SUBSCRIPTION_POST_LIMIT,
    SUBSCRIPTION_POST_WINDOW_MS,
  )
}

export async function checkPdvLinkPostRateLimit(storeId: string): Promise<boolean> {
  return checkStoreRateLimit('pdv:link', storeId, PDV_LINK_POST_LIMIT, PDV_LINK_POST_WINDOW_MS)
}

export async function checkSubaccountPostRateLimit(storeId: string): Promise<boolean> {
  return checkStoreRateLimit(
    'payments:subaccount',
    storeId,
    SUBACCOUNT_POST_LIMIT,
    SUBACCOUNT_POST_WINDOW_MS,
  )
}
