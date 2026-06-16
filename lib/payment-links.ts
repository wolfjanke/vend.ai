import type { PaymentLink, StoreSettings } from '@/types'

export const MAX_PAYMENT_LINKS = 3

export function activePaymentLinks(links: PaymentLink[] | undefined | null): PaymentLink[] {
  if (!Array.isArray(links)) return []
  return links.filter(l => l.active !== false && l.label?.trim() && l.url?.trim())
}

export function sanitizePaymentLinks(links: unknown): PaymentLink[] {
  if (!Array.isArray(links)) return []
  return links
    .slice(0, MAX_PAYMENT_LINKS)
    .map((raw, i) => {
      const item = raw as Partial<PaymentLink>
      return {
        id:     String(item.id ?? `pl-${Date.now()}-${i}`),
        label:  String(item.label ?? '').trim().slice(0, 40),
        url:    String(item.url ?? '').trim(),
        active: item.active !== false,
      }
    })
    .filter(l => l.label && l.url)
}

/** Texto consolidado de pagamento para a Vi. */
export function formatPaymentMethodsForVi(settings: StoreSettings | undefined | null): string {
  if (!settings) return 'Consulte pelo WhatsApp'

  const parts: string[] = []
  const pix = settings.pixKey?.trim()
  if (pix) parts.push(`PIX: ${pix}`)

  for (const link of activePaymentLinks(settings.paymentLinks)) {
    parts.push(`${link.label}: ${link.url}`)
  }

  const info = settings.pagamentoInfo?.trim()
  if (info) parts.push(info)

  return parts.length > 0 ? parts.join(' | ') : 'Consulte pelo WhatsApp'
}
