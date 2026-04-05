'use client'

import { useEffect, useState } from 'react'
import type { PlanSlug } from '@/types'
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

interface Props {
  storeSlug: string
  storeName: string
  plan:      PlanSlug
}

export default function CheckoutWrapper({ storeSlug, storeName, plan }: Props) {
  const [items, setItems] = useState<CartItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`cart_${storeSlug}`)
      if (raw) setItems(JSON.parse(raw))
    } catch {
      // silently ignore
    }
    setLoaded(true)
  }, [storeSlug])

  if (!loaded) return (
    <div className="min-h-screen flex items-center justify-center text-muted text-sm">
      Carregando...
    </div>
  )

  if (items.length === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-muted text-sm">Seu carrinho está vazio.</p>
      <a
        href={`/${storeSlug}`}
        className="text-primary text-sm font-semibold underline underline-offset-2"
      >
        ← Voltar à loja
      </a>
    </div>
  )

  const grossValue = items.reduce((acc, i) => acc + i.price * i.qty, 0)

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 glass border-b border-border h-14 flex items-center px-4">
        <a href={`/${storeSlug}`} className="text-muted text-sm hover:text-foreground transition-colors">
          ← {storeName}
        </a>
        <span className="mx-auto font-syne font-bold text-sm">Finalizar pedido</span>
      </header>
      <main className="max-w-lg mx-auto p-4 pb-24">
        <CheckoutForm
          storeSlug={storeSlug}
          plan={plan}
          items={items}
          grossValue={grossValue}
        />
      </main>
    </div>
  )
}
