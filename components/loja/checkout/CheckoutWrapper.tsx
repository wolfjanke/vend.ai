'use client'

import { useEffect, useState } from 'react'
import type { PlanSlug, StoreSettings } from '@/types'
import type { CheckoutRates } from '@/lib/checkout-rates'
import CheckoutPageLayout from './CheckoutPageLayout'
import CheckoutForm from './CheckoutForm'

interface CartItem {
  product_id:  string
  variant_id:  string
  name:        string
  size:        string
  color:       string
  qty:         number
  price:       number
  photo?:      string
}

interface CheckoutMeta {
  couponCode?: string
}

interface Props {
  storeSlug:      string
  storeName:      string
  storeLogo?:     string | null
  plan:           PlanSlug
  rates:          CheckoutRates
  asaasEnv:       'sandbox' | 'production'
  storeSettings?: StoreSettings
}

export default function CheckoutWrapper({
  storeSlug, storeName, storeLogo, plan, rates, asaasEnv, storeSettings = {},
}: Props) {
  const [items, setItems] = useState<CartItem[]>([])
  const [initialCoupon, setInitialCoupon] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`cart_${storeSlug}`)
      if (raw) setItems(JSON.parse(raw))
      const metaRaw = sessionStorage.getItem(`checkout_meta_${storeSlug}`)
      if (metaRaw) {
        const meta = JSON.parse(metaRaw) as CheckoutMeta
        if (meta.couponCode) setInitialCoupon(meta.couponCode)
      }
    } catch {
      // silently ignore
    }
    setLoaded(true)
  }, [storeSlug])

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted text-sm">
        Carregando...
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <CheckoutPageLayout storeName={storeName} storeLogo={storeLogo} storeSlug={storeSlug}>
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <p className="text-muted text-sm">Seu carrinho está vazio.</p>
          <a
            href={`/${storeSlug}`}
            className="text-primary text-sm font-semibold underline underline-offset-2 min-h-[44px] flex items-center"
          >
            ← Voltar à loja
          </a>
        </div>
      </CheckoutPageLayout>
    )
  }

  const grossValue = items.reduce((acc, i) => acc + i.price * i.qty, 0)

  return (
    <CheckoutPageLayout storeName={storeName} storeLogo={storeLogo} storeSlug={storeSlug}>
      <CheckoutForm
        storeSlug={storeSlug}
        storeName={storeName}
        plan={plan}
        rates={rates}
        asaasEnv={asaasEnv}
        items={items}
        grossValue={grossValue}
        storeSettings={storeSettings}
        initialCouponCode={initialCoupon}
      />
    </CheckoutPageLayout>
  )
}
