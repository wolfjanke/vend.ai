'use client'

import { useState, useMemo } from 'react'
import type { Product, ProductVariant } from '@/types'
import { resolveSkuUnitPrice } from '@/lib/product-pricing'
import PdvPaymentSelector from './PdvPaymentSelector'
import PdvProductSearch from './PdvProductSearch'
import PdvVariantPicker from './PdvVariantPicker'
import PdvCartPanel from './PdvCartPanel'
import PdvMobileCheckoutBar from './PdvMobileCheckoutBar'
import type { PdvCartItem, PdvDiscType } from './pdv-types'

interface Props {
  storeId:       string
  products:      Product[]
  storeHasAsaas: boolean
  storeWhatsapp: string
}

export default function PdvSale({ storeId, products, storeHasAsaas, storeWhatsapp }: Props) {
  const [search,        setSearch]        = useState('')
  const [cart,          setCart]          = useState<PdvCartItem[]>([])
  const [pickerProduct, setPickerProduct] = useState<Product | null>(null)
  const [discount,      setDiscount]      = useState('')
  const [discType,      setDiscType]      = useState<PdvDiscType>('fixed')
  const [custName,      setCustName]      = useState('')
  const [custPhone,     setCustPhone]     = useState('')
  const [step,          setStep]          = useState<'items' | 'payment' | 'done'>('items')
  const [doneMsg,       setDoneMsg]       = useState('')

  const filtered = useMemo(() => {
    if (search.trim().length < 2) return []
    const q = search.toLowerCase()
    return products.filter(p => p.name.toLowerCase().includes(q)).slice(0, 20)
  }, [search, products])

  const subtotal = cart.reduce((acc, i) => acc + i.price * i.qty, 0)

  const discountAmount = useMemo(() => {
    const d = parseFloat(discount.replace(',', '.'))
    if (!d || isNaN(d)) return 0
    if (discType === 'pct') return Math.round(subtotal * (d / 100) * 100) / 100
    return Math.min(d, subtotal)
  }, [discount, discType, subtotal])

  const total = Math.max(0, subtotal - discountAmount)

  function addToCart(product: Product, variant: ProductVariant, size: string) {
    const existing = cart.findIndex(c => c.variantId === variant.id && c.size === size)
    if (existing >= 0) {
      setCart(c => c.map((item, i) => i === existing ? { ...item, qty: item.qty + 1 } : item))
    } else {
      setCart(c => [...c, {
        productId: product.id,
        variantId: variant.id,
        name:      product.name,
        color:     variant.color,
        size,
        price:     resolveSkuUnitPrice(product, variant, size),
        qty:       1,
      }])
    }
  }

  function handleQtyChange(idx: number, delta: number) {
    setCart(c => c.map((item, i) => {
      if (i !== idx) return item
      return { ...item, qty: Math.max(1, item.qty + delta) }
    }))
  }

  function removeFromCart(idx: number) {
    setCart(c => c.filter((_, i) => i !== idx))
  }

  function onDone(msg: string) {
    setDoneMsg(msg)
    setStep('done')
    setCart([])
    setSearch('')
    setPickerProduct(null)
    setDiscount('')
    setCustName('')
    setCustPhone('')
  }

  function goToPayment() {
    if (cart.length === 0) return
    setStep('payment')
  }

  if (step === 'done') {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">✓</div>
        <h2 className="font-syne font-bold text-xl mb-2">Venda registrada!</h2>
        <p className="text-muted text-sm mb-6 break-words">{doneMsg}</p>
        <button
          type="button"
          onClick={() => setStep('items')}
          className="px-6 py-3 min-h-[44px] bg-primary text-white font-syne font-bold text-sm rounded-xl hover:shadow-[0_4px_20px_var(--primary-glow)] transition-all"
        >
          Nova venda
        </button>
      </div>
    )
  }

  if (step === 'payment') {
    return (
      <PdvPaymentSelector
        storeId={storeId}
        cart={cart}
        total={total}
        discount={discountAmount}
        custName={custName}
        custPhone={custPhone}
        storeHasAsaas={storeHasAsaas}
        storeWhatsapp={storeWhatsapp}
        onDone={onDone}
        onBack={() => setStep('items')}
      />
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 min-w-0 pb-24 xl:pb-0">
        <PdvProductSearch
          search={search}
          onSearchChange={setSearch}
          products={filtered}
          onChooseProduct={setPickerProduct}
        />

        <div className="xl:col-span-5 min-w-0">
          <PdvCartPanel
            cart={cart}
            subtotal={subtotal}
            discount={discount}
            discType={discType}
            discountAmount={discountAmount}
            total={total}
            custName={custName}
            custPhone={custPhone}
            onDiscountChange={setDiscount}
            onDiscTypeChange={setDiscType}
            onCustNameChange={setCustName}
            onCustPhoneChange={setCustPhone}
            onQtyChange={handleQtyChange}
            onRemove={removeFromCart}
            onFinalize={goToPayment}
            showFinalizeButton
          />
        </div>
      </div>

      <PdvVariantPicker
        product={pickerProduct}
        onClose={() => setPickerProduct(null)}
        onSelect={(variant, size) => {
          if (pickerProduct) addToCart(pickerProduct, variant, size)
        }}
      />

      <PdvMobileCheckoutBar
        total={total}
        hasItems={cart.length > 0}
        onFinalize={goToPayment}
      />
    </>
  )
}
