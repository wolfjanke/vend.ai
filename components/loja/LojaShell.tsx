'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import type { Product, Store, CartItem, StoreContext, BannerMessage, DeliveryAddress, CheckoutChannel, CheckoutPaymentMethod } from '@/types'
import type { StoreThemeConfig } from '@/lib/themes'
import type { PlanSlug } from '@/lib/plans'
import { isPaidViPlan } from '@/lib/plans'
import { getStoreProfile, getSegmentLabel } from '@/types'
import Carrinho from '@/components/loja/Carrinho'
import LojaHeader from '@/components/loja/LojaHeader'
import ViChat from '@/components/loja/ViChat'
import { LojaProvider, type LojaContextValue } from '@/components/loja/LojaContext'
import { buildWhatsAppUrl, formatOrderMessage, generateOrderNumber } from '@/lib/whatsapp'
import {
  browseIdleMessage,
  cartAbandonedMessage,
  defaultWelcomeMessage,
  inactivityChatMessage,
  productFocusMessage,
  productToTrigger,
} from '@/lib/vi-triggers'

const BANNER_ROTATE_MS = 6000

function installmentsMaxFromSettings(raw: unknown): number | null {
  if (raw == null || raw === '') return null
  const n = typeof raw === 'number' ? raw : Number(String(raw).trim())
  if (!Number.isFinite(n) || n < 1 || n > 48) return null
  return Math.floor(n)
}

function filterActiveBanners(messages: BannerMessage[] | undefined): BannerMessage[] {
  if (!messages?.length) return []
  const now = new Date().toISOString().slice(0, 10)
  return messages.filter(m => {
    if (!m.text?.trim()) return false
    if (m.startDate && m.endDate && m.startDate > m.endDate) return false
    if (m.startDate && m.startDate > now) return false
    if (m.endDate && m.endDate < now) return false
    return true
  }).sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''))
}

function triggerKey(storeSlug: string, type: string): string {
  return `vi-trigger:${storeSlug}:${type}`
}

function wasTriggered(storeSlug: string, type: string): boolean {
  if (typeof sessionStorage === 'undefined') return true
  return sessionStorage.getItem(triggerKey(storeSlug, type)) === '1'
}

function markTriggered(storeSlug: string, type: string): void {
  try {
    sessionStorage.setItem(triggerKey(storeSlug, type), '1')
  } catch { /* ignore */ }
}

interface Props {
  store:     Store
  products:  Product[]
  cardTheme: StoreThemeConfig
  plan?:     PlanSlug
  children:  React.ReactNode
}

export default function LojaShell({ store, products, cardTheme, plan = 'free', children }: Props) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [viOpen, setViOpen] = useState(false)
  const [pendingViMessage, setPendingViMessage] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [dialogVisible, setDialogVisible] = useState(false)
  const inactivityRef = useRef<ReturnType<typeof setTimeout>>()
  const inactivityShownRef = useRef(false)
  const browseTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const cartTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const productFocusTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const focusedProductRef = useRef<Product | null>(null)

  const settings = store.settings_json ?? {}
  const storeProfile = useMemo(() => getStoreProfile(settings), [settings])
  const activeBanners = useMemo(() => filterActiveBanners(settings.bannerMessages), [settings])
  const [bannerIndex, setBannerIndex] = useState(0)

  const baseUrl =
    (typeof process.env.NEXT_PUBLIC_APP_URL === 'string'
      ? process.env.NEXT_PUBLIC_APP_URL
      : ''
    ).replace(/\/$/, '') || (typeof window !== 'undefined' ? window.location.origin : 'https://vendai.club')

  const assistantName = (store.assistant_name?.trim() || 'Vi')
  const welcomeMessage =
    store.assistant_welcome_message?.trim() ||
    defaultWelcomeMessage(assistantName, store.name)

  const paidVi = isPaidViPlan(plan)

  const storeContext: StoreContext = useMemo(() => ({
    storeSlug:      store.slug,
    whatsapp:       store.whatsapp,
    name:           store.name,
    assistantName,
    welcomeMessage,
    plan,
    freteInfo:      settings.freteInfo,
    pagamentoInfo:  settings.pagamentoInfo,
    genderFocus:    storeProfile.genderFocus,
    ageGroup:       storeProfile.ageGroup,
    segmentLabel:   getSegmentLabel(storeProfile),
    products: products.map(p => {
      const slug = p.slug?.trim() || p.id
      const inStock = p.variants_json.some(v =>
        Object.values(v.stock).some(q => Number(q) > 0),
      )
      return {
        id:         p.id,
        slug,
        name:       p.name,
        category:   p.category,
        price:      Number(p.promo_price ?? p.price),
        sizes:      p.variants_json.flatMap(v =>
          Object.entries(v.stock).filter(([, q]) => Number(q) > 0).map(([s]) => s),
        ),
        colors:     p.variants_json.map(v => v.color),
        inStock,
        productUrl: `${baseUrl}/${store.slug}/produto/${slug}`,
      }
    }),
  }), [store, products, settings, storeProfile, assistantName, welcomeMessage, plan, baseUrl])

  const openViWithMessage = useCallback((content: string) => {
    setPendingViMessage(content)
    setViOpen(true)
  }, [])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2500)
  }, [])

  const inactivityDelayMs = useMemo(() => {
    const raw = settings.inactivityDelay
    if (raw == null) return 120_000
    const n = typeof raw === 'number' ? raw : Number(raw)
    if (!Number.isFinite(n) || n < 1) return 120_000
    return Math.min(Math.floor(n), 30 * 60 * 1000)
  }, [settings.inactivityDelay])

  const resetInactivity = useCallback(() => {
    if (inactivityShownRef.current) return
    clearTimeout(inactivityRef.current)
    inactivityRef.current = setTimeout(() => {
      inactivityShownRef.current = true
      setDialogVisible(true)
      if (paidVi && !wasTriggered(store.slug, 'inactivity')) {
        markTriggered(store.slug, 'inactivity')
        const wa = `https://wa.me/${store.whatsapp.replace(/\D/g, '')}`
        openViWithMessage(inactivityChatMessage(assistantName, wa))
      }
    }, inactivityDelayMs)
  }, [inactivityDelayMs, paidVi, store.slug, store.whatsapp, assistantName, openViWithMessage])

  const dismissInactivityDialog = useCallback(() => {
    inactivityShownRef.current = true
    clearTimeout(inactivityRef.current)
    setDialogVisible(false)
  }, [])

  useEffect(() => {
    const events = ['mousemove', 'click', 'keydown', 'scroll', 'touchstart']
    events.forEach(e => window.addEventListener(e, resetInactivity))
    resetInactivity()
    return () => {
      events.forEach(e => window.removeEventListener(e, resetInactivity))
      clearTimeout(inactivityRef.current)
    }
  }, [resetInactivity])

  useEffect(() => {
    if (activeBanners.length <= 1) return
    const t = setInterval(() => {
      setBannerIndex(i => (i + 1) % activeBanners.length)
    }, BANNER_ROTATE_MS)
    return () => clearInterval(t)
  }, [activeBanners.length])

  // Gatilho: 60s navegando sem abrir o chat
  useEffect(() => {
    if (!paidVi) return
    if (wasTriggered(store.slug, 'browse60')) return
    browseTimerRef.current = setTimeout(() => {
      if (viOpen) return
      markTriggered(store.slug, 'browse60')
      openViWithMessage(browseIdleMessage(assistantName))
    }, 60_000)
    return () => clearTimeout(browseTimerRef.current)
  }, [paidVi, store.slug, viOpen, assistantName, openViWithMessage])

  // Gatilho: carrinho abandonado 3min
  useEffect(() => {
    clearTimeout(cartTimerRef.current)
    if (!paidVi || cart.length === 0) return
    if (wasTriggered(store.slug, 'cart3m')) return
    cartTimerRef.current = setTimeout(() => {
      if (cart.length === 0) return
      markTriggered(store.slug, 'cart3m')
      openViWithMessage(cartAbandonedMessage())
    }, 180_000)
    return () => clearTimeout(cartTimerRef.current)
  }, [paidVi, cart.length, store.slug, openViWithMessage])

  const onProductFocus = useCallback((product: Product) => {
    focusedProductRef.current = product
    clearTimeout(productFocusTimerRef.current)
    if (!paidVi || wasTriggered(store.slug, `product:${product.id}`)) return
    productFocusTimerRef.current = setTimeout(() => {
      if (focusedProductRef.current?.id !== product.id) return
      markTriggered(store.slug, `product:${product.id}`)
      const trigger = productToTrigger(product, baseUrl, store.slug)
      if (!trigger.inStock) return
      openViWithMessage(productFocusMessage(trigger))
    }, 35_000)
  }, [paidVi, store.slug, baseUrl, openViWithMessage])

  const addToCart = useCallback((item: CartItem) => {
    setCart(prev => {
      const idx = prev.findIndex(
        c => c.product_id === item.product_id && c.size === item.size && c.variant_id === item.variant_id,
      )
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 }
        return next
      }
      return [...prev, item]
    })
    showToast(`${item.name} adicionado!`)
  }, [showToast])

  const changeQty = useCallback((idx: number, delta: number) => {
    setCart(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], qty: next[idx].qty + delta }
      return next.filter(c => c.qty > 0)
    })
  }, [])

  const removeItem = useCallback((idx: number) => {
    setCart(prev => prev.filter((_, i) => i !== idx))
  }, [])

  const checkout = useCallback(async (
    name: string,
    phone: string,
    notes: string,
    delivery: DeliveryAddress,
    paymentMethod: CheckoutPaymentMethod,
    couponCode: string | undefined,
    meta: { deliveryFee: number; checkoutChannel: CheckoutChannel },
  ) => {
    try {
      const res = await fetch('/api/pedidos', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          storeId:          store.id,
          items:            cart,
          customerName:     name,
          customerWhatsapp: phone,
          notes,
          paymentMethod,
          couponCode,
          deliveryAddress:  delivery,
          deliveryFee:      meta.deliveryFee,
          checkoutChannel:  meta.checkoutChannel,
          privacyConsent:   true,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        showToast(err?.error ?? 'Não foi possível registrar o pedido')
        return
      }
      const data = await res.json()
      const orderNum = data.orderNumber ?? generateOrderNumber()
      const msg = formatOrderMessage({
        store,
        items: cart,
        name,
        phone,
        notes,
        orderNum,
        deliveryAddress: delivery,
        pricing: data.pricing,
        checkoutChannel: meta.checkoutChannel,
        paymentMethod,
      })
      window.open(buildWhatsAppUrl(store.whatsapp, msg), '_blank')
      setCart([])
      setCartOpen(false)
      showToast('Pedido enviado com sucesso!')
    } catch {
      showToast('Erro ao registrar pedido')
    }
  }, [cart, store, showToast])

  const lojaValue: LojaContextValue = {
    store,
    products,
    cardTheme,
    plan,
    storeContext,
    cart,
    cartOpen,
    setCartOpen,
    addToCart,
    viOpen,
    setViOpen,
    openViWithMessage,
    onProductFocus,
    baseUrl,
  }

  const totalQty = cart.reduce((s, c) => s + c.qty, 0)

  return (
    <LojaProvider value={lojaValue}>
      <div className="relative z-10">
        <LojaHeader
          slug={store.slug}
          storeName={store.name}
          whatsapp={store.whatsapp}
          logoUrl={store.theme_logo_url?.trim() || store.logo_url?.trim() || null}
          tagline={store.tagline}
          themeName={store.theme_name as import('@/lib/themes').ThemeName}
          cartQty={totalQty}
          onOpenCart={() => setCartOpen(true)}
        />

        {activeBanners.length > 0 && (
          <div
            className="px-4 py-3 border-b"
            style={{
              background: 'var(--theme-primary-surface)',
              borderColor:  'var(--theme-primary-border)',
            }}
          >
            <div className="mx-auto w-full max-w-5xl">
              <p className="text-sm text-foreground text-center break-words">
                {activeBanners[bannerIndex]?.text}
              </p>
            </div>
          </div>
        )}

        {children}

        <Carrinho
          isOpen={cartOpen}
          cart={cart}
          onClose={() => setCartOpen(false)}
          onChangeQty={changeQty}
          onRemove={removeItem}
          onCheckout={checkout}
          pixDiscountPercent={Number(settings.pixDiscountPercent ?? 0)}
          couponRules={settings.couponRules ?? []}
          storeSettings={settings}
          storeSlug={store.slug}
          storeWhatsapp={store.whatsapp}
          checkoutSiteEnabled={store.checkoutSiteEnabled === true}
          checkoutWhatsappEnabled={store.checkoutWhatsappEnabled !== false}
        />

        <ViChat
          isOpen={viOpen}
          onToggle={() => setViOpen(v => !v)}
          storeContext={storeContext}
          pendingMessage={pendingViMessage}
          onPendingMessageShown={() => setPendingViMessage(null)}
        />

        {dialogVisible && (
          <div className="fixed inset-0 z-[300] bg-bg/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 max-w-sm w-full max-w-[calc(100vw-16px)] text-center">
              <h3 className="inactivity-modal-title font-syne font-bold mb-2">Ainda está por aqui?</h3>
              <p className="inactivity-modal-body text-muted mb-6 break-words">
                Posso te ajudar a encontrar algo especial ou prefere falar com a gente?
              </p>
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    window.open(`https://wa.me/${store.whatsapp}?text=Olá!`, '_blank')
                    dismissInactivityDialog()
                  }}
                  className="inactivity-modal-btn w-full min-h-[44px] py-3.5 bg-accent text-bg rounded-xl font-syne font-bold"
                >
                  Falar com vendedor
                </button>
                <button
                  type="button"
                  onClick={dismissInactivityDialog}
                  className="inactivity-modal-btn w-full min-h-[44px] py-3.5 border border-border text-muted rounded-xl"
                >
                  Continuar escolhendo
                </button>
              </div>
            </div>
          </div>
        )}

        <div
          className={`fixed bottom-24 left-1/2 z-[400] w-[min(100vw-2rem,28rem)] -translate-x-1/2 bg-surface2 border border-accent/30 rounded-xl px-4 py-3 text-sm font-medium text-accent text-center pointer-events-none transition-all duration-300 break-words ${toastVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          {toast}
        </div>
      </div>
    </LojaProvider>
  )
}
