import type { CheckoutStoreInput } from '@/lib/checkout-enabled'
import { isCheckoutEnabledForStore } from '@/lib/checkout-enabled'

export type CheckoutMode =
  | 'whatsapp_only'
  | 'whatsapp_and_checkout'
  | 'checkout_only'

export const CHECKOUT_MODES: CheckoutMode[] = [
  'whatsapp_only',
  'whatsapp_and_checkout',
  'checkout_only',
]

export function normalizeCheckoutMode(value: unknown): CheckoutMode {
  if (value === 'whatsapp_and_checkout' || value === 'checkout_only') return value
  return 'whatsapp_only'
}

export function checkoutModeIncludesSite(mode: CheckoutMode): boolean {
  return mode === 'whatsapp_and_checkout' || mode === 'checkout_only'
}

/** Canais efetivos na vitrine (modo do lojista + elegibilidade Asaas). */
export function resolveCheckoutChannelsFromStore(store: CheckoutStoreInput & {
  checkout_mode?: string | null
}): { siteEnabled: boolean; whatsappEnabled: boolean } {
  const mode = normalizeCheckoutMode(store.checkout_mode)
  const eligible = isCheckoutEnabledForStore(store)

  if (mode === 'checkout_only' && eligible) {
    return { siteEnabled: true, whatsappEnabled: false }
  }

  if (mode === 'whatsapp_and_checkout' && eligible) {
    return { siteEnabled: true, whatsappEnabled: true }
  }

  return { siteEnabled: false, whatsappEnabled: true }
}

/** Sincroniza checkoutChannels legado em settings_json ao salvar checkout_mode. */
export function checkoutChannelsFromMode(mode: CheckoutMode): {
  siteEnabled: boolean
  whatsappEnabled: boolean
} {
  switch (mode) {
    case 'checkout_only':
      return { siteEnabled: true, whatsappEnabled: false }
    case 'whatsapp_and_checkout':
      return { siteEnabled: true, whatsappEnabled: true }
    default:
      return { siteEnabled: false, whatsappEnabled: true }
  }
}
