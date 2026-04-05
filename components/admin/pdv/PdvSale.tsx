'use client'

import { useState, useMemo } from 'react'
import type { Product, ProductVariant } from '@/types'
import { SIZES } from '@/types'
import PdvPaymentSelector from './PdvPaymentSelector'

interface CartItem {
  productId:  string
  variantId:  string
  name:       string
  color:      string
  size:       string
  price:      number
  qty:        number
}

interface Props {
  storeId:       string
  products:      Product[]
  storeHasAsaas: boolean
  storeWhatsapp: string
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function PdvSale({ storeId, products, storeHasAsaas, storeWhatsapp }: Props) {
  const [search,   setSearch]   = useState('')
  const [cart,     setCart]     = useState<CartItem[]>([])
  const [discount, setDiscount] = useState('')
  const [discType, setDiscType] = useState<'pct' | 'fixed'>('fixed')
  const [custName, setCustName] = useState('')
  const [custPhone, setCustPhone] = useState('')
  const [step, setStep]         = useState<'items' | 'payment' | 'done'>('items')
  const [doneMsg, setDoneMsg]   = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return products.slice(0, 20)
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
        price:     Number(product.price),
        qty:       1,
      }])
    }
  }

  function removeFromCart(idx: number) {
    setCart(c => c.filter((_, i) => i !== idx))
  }

  function onDone(msg: string) {
    setDoneMsg(msg)
    setStep('done')
    setCart([])
    setSearch('')
    setDiscount('')
    setCustName('')
    setCustPhone('')
  }

  if (step === 'done') {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">✓</div>
        <h2 className="font-syne font-bold text-xl mb-2">Venda registrada!</h2>
        <p className="text-muted text-sm mb-6 break-words">{doneMsg}</p>
        <button
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
    <div className="space-y-4">
      {/* Busca de produtos */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <div className="font-syne font-bold text-sm mb-3">Adicionar produtos</div>
        <input
          className="w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-sm outline-none focus:border-primary transition-all mb-3"
          placeholder="Buscar produto por nome…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filtered.map(p => (
            <div key={p.id} className="bg-surface2 border border-border rounded-xl p-3">
              <div className="font-semibold text-sm mb-2">{p.name} — <span className="text-accent">{formatCurrency(Number(p.price))}</span></div>
              <div className="space-y-1">
                {(p.variants_json ?? []).map((v: ProductVariant) => (
                  <div key={v.id} className="flex flex-wrap gap-1.5 items-center">
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <span className="w-3 h-3 rounded-full border border-border/50" style={{ background: v.colorHex }} />
                      {v.color}
                    </span>
                    {SIZES.filter(s => (v.stock?.[s] ?? 0) > 0).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => addToCart(p, v, s)}
                        className="px-2 py-0.5 border border-border rounded-lg text-xs hover:border-primary hover:text-primary transition-all min-h-[32px]"
                      >
                        {s}
                      </button>
                    ))}
                    {/* Permite adicionar sem tamanho se não houver estoque definido */}
                    {!SIZES.some(s => (v.stock?.[s] ?? 0) > 0) && (
                      <button
                        type="button"
                        onClick={() => addToCart(p, v, 'Único')}
                        className="px-2 py-0.5 border border-border rounded-lg text-xs hover:border-primary hover:text-primary transition-all min-h-[32px]"
                      >
                        + Adicionar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center text-muted text-sm py-4">Nenhum produto encontrado</p>}
        </div>
      </div>

      {/* Carrinho PDV */}
      {cart.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-4">
          <div className="font-syne font-bold text-sm mb-3">Itens da venda</div>
          <div className="space-y-2 mb-4">
            {cart.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium">{item.name}</div>
                  <div className="text-xs text-muted">{item.color} — {item.size}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button type="button" onClick={() => setCart(c => c.map((ci, idx) => idx === i ? { ...ci, qty: Math.max(1, ci.qty - 1) } : ci))} className="w-7 h-7 rounded-lg border border-border hover:border-primary text-sm">−</button>
                  <span className="w-6 text-center tabular-nums">{item.qty}</span>
                  <button type="button" onClick={() => setCart(c => c.map((ci, idx) => idx === i ? { ...ci, qty: ci.qty + 1 } : ci))} className="w-7 h-7 rounded-lg border border-border hover:border-primary text-sm">+</button>
                </div>
                <span className="text-accent tabular-nums shrink-0">{formatCurrency(item.price * item.qty)}</span>
                <button type="button" onClick={() => removeFromCart(i)} className="text-warm text-xs px-1.5 py-0.5 hover:bg-warm/10 rounded">✕</button>
              </div>
            ))}
          </div>

          {/* Desconto */}
          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1">Desconto</label>
              <input
                className="w-full min-h-[44px] px-3 py-2 bg-surface2 border border-border rounded-xl text-sm outline-none focus:border-primary transition-all"
                placeholder={discType === 'pct' ? '10%' : 'R$ 0,00'}
                value={discount}
                onChange={e => setDiscount(e.target.value)}
              />
            </div>
            <div className="shrink-0">
              <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1">Tipo</label>
              <select
                className="min-h-[44px] px-3 py-2 bg-surface2 border border-border rounded-xl text-sm outline-none focus:border-primary transition-all"
                value={discType}
                onChange={e => setDiscType(e.target.value as 'pct' | 'fixed')}
              >
                <option value="fixed">R$</option>
                <option value="pct">%</option>
              </select>
            </div>
          </div>

          {/* Totais */}
          <div className="border-t border-border pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-accent">
                <span>Desconto</span>
                <span className="tabular-nums">−{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span className="text-accent tabular-nums">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Dados do cliente (opcional) */}
      {cart.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-4">
          <div className="font-syne font-bold text-sm mb-3">Cliente (opcional)</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">Nome</label>
              <input className="w-full min-h-[44px] px-3 py-2 bg-surface2 border border-border rounded-xl text-sm outline-none focus:border-primary transition-all" value={custName} onChange={e => setCustName(e.target.value)} placeholder="Nome do cliente" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">WhatsApp</label>
              <input className="w-full min-h-[44px] px-3 py-2 bg-surface2 border border-border rounded-xl text-sm outline-none focus:border-primary transition-all" value={custPhone} onChange={e => setCustPhone(e.target.value)} placeholder="(11) 99999-9999" />
            </div>
          </div>
        </div>
      )}

      {cart.length > 0 && (
        <button
          type="button"
          onClick={() => setStep('payment')}
          className="w-full min-h-[44px] py-3.5 bg-primary text-white font-syne font-bold text-sm rounded-xl hover:shadow-[0_4px_20px_var(--primary-glow)] transition-all"
        >
          Finalizar venda — {formatCurrency(total)}
        </button>
      )}
    </div>
  )
}
