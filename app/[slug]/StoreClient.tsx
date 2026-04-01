'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import type { Product, Store, CartItem, StoreContext, BannerMessage, DeliveryAddress, CheckoutChannel, CheckoutPaymentMethod } from '@/types'
import { getStoreProfile, getSegmentLabel } from '@/types'
import Catalogo    from '@/components/loja/Catalogo'
import Carrinho    from '@/components/loja/Carrinho'
import ViChat      from '@/components/loja/ViChat'
import { buildWhatsAppUrl, formatOrderMessage, generateOrderNumber } from '@/lib/whatsapp'

const BANNER_ROTATE_MS = 6000

function filterActiveBanners(messages: BannerMessage[] | undefined): BannerMessage[] {
  if (!messages?.length) return []
  const now = new Date().toISOString().slice(0, 10)
  return messages.filter(m => {
    if (!m.text?.trim()) return false
    if (m.startDate && m.endDate && m.startDate > m.endDate) return false
    if (m.startDate && m.startDate > now) return false
    if (m.endDate && m.endDate < now) return false
    return true
  }).sort((a, b) => {
    const ad = a.startDate || ''
    const bd = b.startDate || ''
    return bd.localeCompare(ad)
  })
}

interface Props {
  store:    Store
  products: Product[]
}

export default function StoreClient({ store, products }: Props) {
  const [cart,          setCart]          = useState<CartItem[]>([])
  const [cartOpen,      setCartOpen]      = useState(false)
  const [viOpen,        setViOpen]        = useState(false)
  const [toast,         setToast]         = useState('')
  const [toastVisible,  setToastVisible]  = useState(false)
  const [dialogVisible, setDialogVisible] = useState(false)
  const inactivityRef = useRef<ReturnType<typeof setTimeout>>()
  const settings      = store.settings_json ?? {}
  const storeProfile  = useMemo(() => getStoreProfile(settings), [settings])
  const activeBanners = useMemo(() => filterActiveBanners(settings.bannerMessages), [store.settings_json])
  const [bannerIndex, setBannerIndex] = useState(0)

  useEffect(() => {
    if (activeBanners.length <= 1) return
    const t = setInterval(() => {
      setBannerIndex(i => (i + 1) % activeBanners.length)
    }, BANNER_ROTATE_MS)
    return () => clearInterval(t)
  }, [activeBanners.length])

  // Build store context for Vi
  const storeContext: StoreContext = {
    name:           store.name,
    freteInfo:      settings.freteInfo,
    pagamentoInfo:  settings.pagamentoInfo,
    genderFocus:    storeProfile.genderFocus,
    ageGroup:       storeProfile.ageGroup,
    segmentLabel:   getSegmentLabel(storeProfile),
    products: products.map(p => ({
      name:     p.name,
      category: p.category,
      price:    Number(p.price),
      sizes:    p.variants_json.flatMap(v => Object.entries(v.stock).filter(([,q]) => Number(q) > 0).map(([s]) => s)),
      colors:   p.variants_json.map(v => v.color),
      inStock:  p.variants_json.some(v => Object.values(v.stock).some(q => Number(q) > 0)),
    })),
  }

  // ── Toast ────────────────────────────────────────────────────────────────────
  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2500)
  }, [])

  // ── Inactivity ───────────────────────────────────────────────────────────────
  const resetInactivity = useCallback(() => {
    clearTimeout(inactivityRef.current)
    inactivityRef.current = setTimeout(() => setDialogVisible(true), 120_000)
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

  // ── Cart helpers ──────────────────────────────────────────────────────────────
  const addToCart = useCallback((item: CartItem) => {
    setCart(prev => {
      const idx = prev.findIndex(c => c.product_id === item.product_id && c.size === item.size && c.variant_id === item.variant_id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 }
        return next
      }
      return [...prev, item]
    })
    showToast(`✓ ${item.name} adicionado!`)
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

  // ── Checkout ──────────────────────────────────────────────────────────────────
  const checkout = useCallback(async (
    name: string,
    phone: string,
    notes: string,
    delivery: DeliveryAddress,
    paymentMethod: CheckoutPaymentMethod,
    couponCode: string | undefined,
    meta: { deliveryFee: number; checkoutChannel: CheckoutChannel }
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
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        showToast(err?.error ?? '⚠️ Não foi possível registrar o pedido')
        return
      }

      const data = await res.json()
      const orderNum = data.orderNumber ?? generateOrderNumber()
      const pricing = data.pricing

      const msg = formatOrderMessage({
        store,
        items: cart,
        name,
        phone,
        notes,
        orderNum,
        deliveryAddress: delivery,
        pricing,
        checkoutChannel: meta.checkoutChannel,
        paymentMethod,
      })
      const url = buildWhatsAppUrl(store.whatsapp, msg)
      window.open(url, '_blank')

      setCart([])
      setCartOpen(false)
      showToast('🎉 Pedido enviado com sucesso!')
    } catch {
      showToast('⚠️ Erro ao registrar pedido')
    }
  }, [cart, store, showToast])

  const totalQty = cart.reduce((s, c) => s + c.qty, 0)

  return (
    <div className="relative z-10">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border h-16 px-4 md:px-6 animate-slide-down">
        <div className="mx-auto flex h-full w-full max-w-5xl items-center justify-between">
          <span className="font-syne font-extrabold text-xl text-grad">vend<span className="text-accent" style={{ WebkitTextFillColor: 'var(--accent)', opacity: 1 }}>.</span>ai</span>
          <span className="font-syne text-xs font-semibold text-muted tracking-[2px] uppercase hidden sm:block">{store.name}</span>
          <div className="flex gap-2.5 items-center">
            <a href={`https://wa.me/${store.whatsapp}`} target="_blank" rel="noreferrer" className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-accent/10 border border-accent/30 rounded-full text-accent text-xs font-medium hover:bg-accent/20 transition-all">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Vendedor
            </a>
            <button onClick={() => setCartOpen(true)} className="relative w-10 h-10 bg-surface2 border border-border rounded-xl flex items-center justify-center hover:border-primary hover:shadow-[0_0_15px_var(--primary-glow)] transition-all text-foreground">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
              {totalQty > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-primary rounded-full text-[10px] font-bold text-white flex items-center justify-center min-w-[18px] min-h-[18px]">
                  {totalQty}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Banner rotativo */}
      {activeBanners.length > 0 && (
        <div className="px-4 py-3 bg-primary/10 border-b border-primary/20">
          <div className="mx-auto w-full max-w-5xl">
            <p className="text-sm text-foreground text-center">
              {activeBanners[bannerIndex]?.text}
            </p>
            {activeBanners.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-2">
                {activeBanners.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Mensagem ${i + 1}`}
                    onClick={() => setBannerIndex(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${i === bannerIndex ? 'bg-primary' : 'bg-primary/30'}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Catalog */}
      <Catalogo
        products={products}
        profile={storeProfile}
        onAddToCart={addToCart}
        onInteract={resetInactivity}
        installmentsMaxNoInterest={
          typeof settings.installmentsMaxNoInterest === 'number'
            ? settings.installmentsMaxNoInterest
            : null
        }
      />

      {/* Cart drawer */}
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
      />

      {/* Vi chat */}
      <ViChat isOpen={viOpen} onToggle={() => setViOpen(v => !v)} storeContext={storeContext} />

      {/* Inactivity dialog */}
      {dialogVisible && (
        <div className="fixed inset-0 z-[300] bg-bg/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-3xl p-8 max-w-sm w-full text-center shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
            <div className="text-5xl mb-4">👋</div>
            <h3 className="font-syne font-bold text-xl mb-2">Ainda está por aqui?</h3>
            <p className="text-sm text-muted mb-6 leading-relaxed">Posso te ajudar a encontrar algo especial ou prefere falar com uma de nossas vendedoras?</p>
            <div className="flex flex-col gap-2.5">
              <button onClick={() => { window.open(`https://wa.me/${store.whatsapp}?text=Olá!%20Gostaria%20de%20falar%20com%20uma%20vendedora.`, '_blank'); setDialogVisible(false) }} className="w-full py-3.5 bg-accent text-bg rounded-xl font-syne font-bold text-sm hover:shadow-[0_4px_20px_var(--accent-glow)] transition-all">
                💬 Falar com vendedor
              </button>
              <button onClick={() => { setDialogVisible(false); resetInactivity() }} className="w-full py-3.5 border border-border text-muted rounded-xl text-sm hover:border-muted hover:text-foreground transition-all">
                🛍️ Continuar escolhendo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <div className={`fixed bottom-24 left-1/2 z-[400] w-[min(100vw-2rem,28rem)] -translate-x-1/2 bg-surface2 border border-accent/30 rounded-xl px-4 py-3 text-sm font-medium text-accent text-center pointer-events-none transition-all duration-300 break-words ${toastVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {toast}
      </div>
    </div>
  )
}
