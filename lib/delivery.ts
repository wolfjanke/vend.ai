import type { DeliveryZone, StoreSettings } from '@/types'

/** Normaliza cidade para comparação (minúsculas, sem acentos). */
export function normalizeCityKey(city: string): string {
  return String(city ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function findDeliveryZone(
  cidade: string,
  uf: string,
  zones: DeliveryZone[] | undefined
): DeliveryZone | null {
  if (!zones?.length) return null
  const c = normalizeCityKey(cidade)
  const u = String(uf ?? '')
    .trim()
    .toUpperCase()
    .slice(0, 2)
  for (const z of zones) {
    if (normalizeCityKey(z.city) === c && String(z.uf).trim().toUpperCase().slice(0, 2) === u) {
      return z
    }
  }
  return null
}

export interface DeliveryQuoteInput {
  settings:      StoreSettings | null | undefined
  cidade:        string
  uf:              string
  /** subtotal − desconto cupom (base para frete grátis). */
  subtotalAfterCoupon: number
}

export interface DeliveryQuote {
  fee:           number
  freeShipping:  boolean
  zoneMatched:   boolean
  /** Se há zonas cadastradas e a cidade não está na lista. */
  outOfZone:     boolean
}

/**
 * Calcula frete: zonas vazias = R$ 0 e qualquer cidade.
 * Com zonas: só cidades listadas; senão outOfZone.
 * Frete grátis se subtotalAfterCoupon >= freeShippingMin.
 */
export function quoteDelivery(input: DeliveryQuoteInput): DeliveryQuote {
  const zones = input.settings?.deliveryZones ?? []
  const freeMin = input.settings?.freeShippingMin
  const base = Math.max(0, Number(input.subtotalAfterCoupon.toFixed(2)))

  if (!zones.length) {
    const free =
      freeMin != null && freeMin > 0 && base >= freeMin
    return {
      fee: free ? 0 : 0,
      freeShipping: free,
      zoneMatched: true,
      outOfZone: false,
    }
  }

  const zone = findDeliveryZone(input.cidade, input.uf, zones)
  if (!zone) {
    return { fee: 0, freeShipping: false, zoneMatched: false, outOfZone: true }
  }

  let fee = Math.max(0, Number(zone.fee))
  const free =
    freeMin != null && freeMin > 0 && base >= freeMin
  if (free) fee = 0

  return {
    fee,
    freeShipping: free,
    zoneMatched: true,
    outOfZone: false,
  }
}
