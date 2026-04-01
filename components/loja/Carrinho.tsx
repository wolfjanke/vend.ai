'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import type {
  CartItem,
  CheckoutChannel,
  CheckoutPaymentMethod,
  CouponRule,
  DeliveryAddress,
  StoreSettings,
} from '@/types'
import MaskedInput from '@/components/ui/MaskedInput'
import CepInput from '@/components/ui/CepInput'
import { calculateCheckoutPricing } from '@/lib/pricing'
import { quoteDelivery } from '@/lib/delivery'

type Step = 'cart' | 'delivery' | 'channel' | 'payment'

interface Props {
  isOpen:     boolean
  cart:       CartItem[]
  onClose:    () => void
  onChangeQty:(idx: number, delta: number) => void
  onRemove:   (idx: number) => void
  onCheckout: (
    name: string,
    phone: string,
    notes: string,
    delivery: DeliveryAddress,
    paymentMethod: CheckoutPaymentMethod,
    couponCode: string | undefined,
    meta: { deliveryFee: number; checkoutChannel: CheckoutChannel }
  ) => Promise<void>
  pixDiscountPercent?: number
  couponRules?: CouponRule[]
  storeSettings?: StoreSettings
}

export default function Carrinho({
  isOpen,
  cart,
  onClose,
  onChangeQty,
  onRemove,
  onCheckout,
  pixDiscountPercent = 0,
  couponRules = [],
  storeSettings,
}: Props) {
  const [step, setStep] = useState<Step>('cart')
  const [checkoutChannel, setCheckoutChannel] = useState<CheckoutChannel>('whatsapp')

  const [name,    setName]    = useState('')
  const [phone,   setPhone]   = useState('')
  const [notes,   setNotes]   = useState('')
  const [cep, setCep] = useState('')
  const [logradouro, setLogradouro] = useState('')
  const [numero, setNumero] = useState('')
  const [complemento, setComplemento] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [uf, setUf] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>('OUTRO')
  const [couponCode, setCouponCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors,  setErrors]  = useState<Record<string, string>>({})

  const settingsMerged: StoreSettings = useMemo(
    () => ({
      ...(storeSettings ?? {}),
      pixDiscountPercent: storeSettings?.pixDiscountPercent ?? pixDiscountPercent,
      couponRules:        storeSettings?.couponRules ?? couponRules,
    }),
    [storeSettings, pixDiscountPercent, couponRules]
  )

  const siteEnabled = storeSettings?.checkoutChannels?.siteEnabled === true
  const whatsappEnabled = storeSettings?.checkoutChannels?.whatsappEnabled !== false

  const pricing = useMemo(
    () =>
      calculateCheckoutPricing({
        items: cart,
        paymentMethod: paymentMethod === 'PIX' ? 'PIX' : 'OUTRO',
        couponCode,
        settings: settingsMerged,
      }),
    [cart, paymentMethod, couponCode, settingsMerged]
  )

  const deliveryQuote = useMemo(
    () =>
      quoteDelivery({
        settings: settingsMerged,
        cidade,
        uf,
        subtotalAfterCoupon: Math.max(0, pricing.subtotal - pricing.discountCoupon),
      }),
    [settingsMerged, cidade, uf, pricing.subtotal, pricing.discountCoupon]
  )

  const deliveryFee = deliveryQuote.fee
  const grandTotal = useMemo(
    () => Math.max(0, Number((pricing.totalFinal + deliveryFee).toFixed(2))),
    [pricing.totalFinal, deliveryFee]
  )

  useEffect(() => {
    if (!isOpen) setStep('cart')
  }, [isOpen])

  useEffect(() => {
    if (cart.length === 0) setStep('cart')
  }, [cart.length])

  const cartPricing = useMemo(
    () =>
      calculateCheckoutPricing({
        items: cart,
        paymentMethod: 'OUTRO',
        couponCode: '',
        settings: settingsMerged,
      }),
    [cart, settingsMerged]
  )

  const goBack = useCallback(() => {
    if (step === 'payment') {
      if (siteEnabled && whatsappEnabled) setStep('channel')
      else setStep('delivery')
    } else if (step === 'channel') {
      setStep('delivery')
    } else if (step === 'delivery') {
      setStep('cart')
    }
  }, [step, siteEnabled, whatsappEnabled])

  function validateAddress(): boolean {
    const e: Record<string, string> = {}
    if (!logradouro.trim()) e.logradouro = 'Informe o endereço'
    if (!numero.trim()) e.numero = 'Informe o número'
    if (!bairro.trim()) e.bairro = 'Informe o bairro'
    if (!cidade.trim()) e.cidade = 'Informe a cidade'
    if (!uf.trim() || uf.length !== 2) e.uf = 'UF inválida'
    const cepD = cep.replace(/\D/g, '')
    if (cepD.length !== 8) e.cep = 'CEP inválido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function validatePayment(): boolean {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Informe seu nome'
    if (!phone.trim()) e.phone = 'Informe seu WhatsApp'
    else {
      const d = phone.replace(/\D/g, '')
      if (d.length < 10 || d.length > 11) e.phone = 'WhatsApp inválido'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function continueFromDelivery() {
    if (!validateAddress()) return
    if (deliveryQuote.outOfZone) {
      alert('No momento não entregamos nesta cidade. Entre em contato com a loja.')
      return
    }
    if (siteEnabled && whatsappEnabled) {
      setStep('channel')
    } else if (siteEnabled && !whatsappEnabled) {
      setCheckoutChannel('site')
      setStep('payment')
    } else {
      setCheckoutChannel('whatsapp')
      setStep('payment')
    }
  }

  function continueFromChannel(ch: CheckoutChannel) {
    setCheckoutChannel(ch)
    setStep('payment')
  }

  async function handleCheckout() {
    if (!validateAddress() || !validatePayment()) return
    if (deliveryQuote.outOfZone) {
      alert('Endereço fora da área de entrega.')
      return
    }

    setLoading(true)
    try {
      const delivery: DeliveryAddress = {
        cep:         cep.includes('-') ? cep : `${cep.slice(0, 5)}-${cep.slice(5)}`,
        logradouro:  logradouro.trim(),
        numero:      numero.trim(),
        complemento: complemento.trim() || undefined,
        bairro:      bairro.trim(),
        cidade:      cidade.trim(),
        uf:          uf.trim().toUpperCase(),
      }
      await onCheckout(
        name.trim(),
        phone.trim(),
        notes.trim(),
        delivery,
        paymentMethod,
        couponCode.trim() || undefined,
        { deliveryFee, checkoutChannel }
      )
      setName(''); setPhone(''); setNotes('')
      setCep(''); setLogradouro(''); setNumero(''); setComplemento('')
      setBairro(''); setCidade(''); setUf('')
      setPaymentMethod('OUTRO'); setCouponCode('')
      setStep('cart')
    } finally {
      setLoading(false)
    }
  }

  const headerTitle =
    step === 'cart'
      ? 'Seu Carrinho'
      : step === 'delivery'
        ? 'Entrega'
        : step === 'channel'
          ? 'Como finalizar'
          : 'Dados e pagamento'

  return (
    <>
      <div
        className={`fixed inset-0 z-[200] bg-bg/85 backdrop-blur-[8px] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <div className={`fixed top-0 right-0 bottom-0 z-[201] w-full max-w-[420px] bg-surface border-l border-border flex flex-col min-h-0 transition-transform duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-5 border-b border-border shrink-0 min-w-0">
          <div className="flex items-center gap-2 font-syne font-bold text-base sm:text-lg min-w-0 flex-1">
            {step !== 'cart' && (
              <button
                type="button"
                onClick={goBack}
                className="min-h-[44px] min-w-[44px] shrink-0 bg-surface2 border border-border rounded-lg flex items-center justify-center text-muted hover:text-foreground transition-colors"
                aria-label="Voltar"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
            )}
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            <span className="truncate">{headerTitle}</span>
          </div>
          <button type="button" onClick={onClose} className="min-h-[44px] min-w-[44px] bg-surface2 border border-border rounded-lg flex items-center justify-center text-muted hover:text-foreground transition-colors shrink-0" aria-label="Fechar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 min-h-0 overscroll-contain">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[12rem] gap-3 text-muted text-center">
              <span className="text-5xl opacity-40">🛍️</span>
              <p>Seu carrinho está vazio</p>
              <p className="text-xs">Adicione produtos para começar</p>
            </div>
          ) : step === 'cart' ? (
            <div className="flex flex-col">
              {cart.map((item, i) => (
                <div key={`${item.product_id}-${item.size}-${item.variant_id}-${i}`} className="flex gap-3 py-3.5 border-b border-border last:border-0">
                  <div className="w-[60px] h-[75px] bg-surface2 rounded-xl flex items-center justify-center text-2xl overflow-hidden flex-shrink-0">
                    {item.photo
                      ? <img src={item.photo} alt="" className="w-full h-full object-cover" />
                      : '👗'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold break-words">{item.name}</div>
                    <div className="text-xs text-muted mb-1.5 break-words">
                      {item.color && `${item.color} • `}Tamanho: {item.size}
                    </div>
                    {item.description?.trim() ? (
                      <p className="text-xs text-muted/90 leading-snug mb-2 line-clamp-4 break-words">{item.description.trim()}</p>
                    ) : null}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-accent font-bold text-sm">
                        R${(item.price * item.qty).toFixed(2).replace('.', ',')}
                      </span>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => onChangeQty(i, -1)} className="min-w-[32px] min-h-[32px] bg-surface2 border border-border rounded-lg flex items-center justify-center text-foreground text-base hover:border-primary hover:text-primary transition-colors">−</button>
                        <span className="text-sm font-semibold min-w-[16px] text-center">{item.qty}</span>
                        <button type="button" onClick={() => onChangeQty(i, 1)}  className="min-w-[32px] min-h-[32px] bg-surface2 border border-border rounded-lg flex items-center justify-center text-foreground text-base hover:border-primary hover:text-primary transition-colors">+</button>
                      </div>
                    </div>
                    <button type="button" onClick={() => onRemove(i)} className="text-warm text-xs mt-1.5 opacity-70 hover:opacity-100 transition-opacity">✕ Remover</button>
                  </div>
                </div>
              ))}
            </div>
          ) : step === 'delivery' ? (
            <div className="flex flex-col gap-2.5 pb-2">
              <p className="text-xs font-bold text-muted uppercase tracking-wider">Endereço de entrega</p>
              <div>
                <label className="text-[11px] text-muted block mb-1">CEP</label>
                <CepInput
                  value={cep}
                  onChange={setCep}
                  onFilled={d => {
                    setLogradouro(d.logradouro)
                    setBairro(d.bairro)
                    setCidade(d.cidade)
                    setUf(d.uf)
                  }}
                />
                {errors.cep && <p className="text-xs text-warm mt-1">{errors.cep}</p>}
              </div>
              <div>
                <label className="text-[11px] text-muted block mb-1">Logradouro</label>
                <input
                  className={`w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border rounded-xl text-sm outline-none ${errors.logradouro ? 'border-warm' : 'border-border focus:border-primary'}`}
                  value={logradouro}
                  onChange={e => setLogradouro(e.target.value)}
                  placeholder="Rua, Avenida…"
                />
                {errors.logradouro && <p className="text-xs text-warm mt-1">{errors.logradouro}</p>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-muted block mb-1">Número</label>
                  <input
                    className={`w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border rounded-xl text-sm ${errors.numero ? 'border-warm' : 'border-border'}`}
                    value={numero}
                    onChange={e => setNumero(e.target.value)}
                  />
                  {errors.numero && <p className="text-xs text-warm mt-1">{errors.numero}</p>}
                </div>
                <div>
                  <label className="text-[11px] text-muted block mb-1">Complemento</label>
                  <input
                    className="w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-sm"
                    value={complemento}
                    onChange={e => setComplemento(e.target.value)}
                    placeholder="Apto…"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-muted block mb-1">Bairro</label>
                <input
                  className={`w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border rounded-xl text-sm ${errors.bairro ? 'border-warm' : 'border-border'}`}
                  value={bairro}
                  onChange={e => setBairro(e.target.value)}
                />
                {errors.bairro && <p className="text-xs text-warm mt-1">{errors.bairro}</p>}
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <div>
                  <label className="text-[11px] text-muted block mb-1">Cidade</label>
                  <input
                    className={`w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border rounded-xl text-sm ${errors.cidade ? 'border-warm' : 'border-border'}`}
                    value={cidade}
                    onChange={e => setCidade(e.target.value)}
                  />
                  {errors.cidade && <p className="text-xs text-warm mt-1">{errors.cidade}</p>}
                </div>
                <div className="w-20">
                  <label className="text-[11px] text-muted block mb-1">UF</label>
                  <input
                    className={`w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border rounded-xl text-sm uppercase ${errors.uf ? 'border-warm' : 'border-border'}`}
                    value={uf}
                    maxLength={2}
                    onChange={e => setUf(e.target.value.toUpperCase())}
                  />
                  {errors.uf && <p className="text-xs text-warm mt-1">{errors.uf}</p>}
                </div>
              </div>
              {cidade.trim() && uf.trim().length === 2 && (
                <div className="rounded-xl border border-border bg-surface2 p-3 text-xs space-y-1">
                  {deliveryQuote.outOfZone ? (
                    <p className="text-warm font-medium">Fora da área de entrega configurada pela loja.</p>
                  ) : (
                    <>
                      <div className="flex justify-between gap-2">
                        <span className="text-muted">Frete estimado</span>
                        <span className="font-semibold text-foreground">
                          {deliveryQuote.freeShipping ? 'Grátis' : `R$${deliveryFee.toFixed(2).replace('.', ',')}`}
                        </span>
                      </div>
                      {deliveryQuote.freeShipping && (settingsMerged.freeShippingMin ?? 0) > 0 && (
                        <p className="text-[10px] text-muted">Pedido acima do mínimo para frete grátis (após cupom).</p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ) : step === 'channel' ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted leading-relaxed">
                Escolha como prefere concluir: pagamento online no site (quando disponível) ou combinar tudo pelo WhatsApp.
              </p>
              {siteEnabled && (
                <button
                  type="button"
                  onClick={() => continueFromChannel('site')}
                  className="w-full min-h-[48px] py-4 px-4 rounded-2xl border-2 border-primary bg-primary/10 text-left hover:bg-primary/20 transition-colors"
                >
                  <span className="font-syne font-bold text-foreground block">Pagar no site</span>
                  <span className="text-xs text-muted mt-1 block">PIX ou cartão — confirmação com a loja</span>
                </button>
              )}
              {whatsappEnabled && (
                <button
                  type="button"
                  onClick={() => continueFromChannel('whatsapp')}
                  className="w-full min-h-[48px] py-4 px-4 rounded-2xl border-2 border-accent/40 bg-accent/5 text-left hover:bg-accent/10 transition-colors"
                >
                  <span className="font-syne font-bold text-foreground block">Finalizar pelo WhatsApp</span>
                  <span className="text-xs text-muted mt-1 block">Dinheiro, PIX ou cartão na entrega — combinando no chat</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 pb-2">
              {checkoutChannel === 'site' && (
                <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-xs text-muted mb-1">
                  Canal: pagamento no site. Você confirma os dados abaixo e enviamos o pedido; combine PIX ou cartão com a loja (checkout online completo em breve).
                </div>
              )}
              <div>
                <input
                  className={`w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border rounded-xl text-foreground text-sm outline-none transition-all placeholder:text-muted ${errors.name ? 'border-warm' : 'border-border focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-dim)]'}`}
                  placeholder="👤 Seu nome completo"
                  value={name}
                  onChange={e => { setName(e.target.value); setErrors(p => { const n = { ...p }; delete n.name; return n }) }}
                />
                {errors.name && <p className="text-xs text-warm mt-1">{errors.name}</p>}
              </div>
              <div>
                <MaskedInput
                  mask="phone"
                  className={`w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border rounded-xl text-foreground text-sm outline-none transition-all placeholder:text-muted ${errors.phone ? 'border-warm' : 'border-border focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-dim)]'}`}
                  placeholder="📱 Seu WhatsApp (11) 99999-9999"
                  value={phone}
                  onChange={v => { setPhone(v); setErrors(p => { const n = { ...p }; delete n.phone; return n }) }}
                  autoComplete="tel"
                />
                {errors.phone && <p className="text-xs text-warm mt-1">{errors.phone}</p>}
              </div>
              <input
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-dim)] transition-all placeholder:text-muted"
                placeholder="📝 Observações (opcional)"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-sm"
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as CheckoutPaymentMethod)}
                >
                  <option value="PIX">Pagamento: PIX</option>
                  <option value="CARTAO">Pagamento: Cartão</option>
                  <option value="DINHEIRO">Pagamento: Dinheiro</option>
                  <option value="OUTRO">Pagamento: Outro</option>
                </select>
                <input
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-sm uppercase"
                  placeholder="Cupom (opcional)"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                />
              </div>
              <div className="rounded-xl border border-border bg-surface2 p-3 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Subtotal</span>
                  <span>R${pricing.subtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Desconto cupom</span>
                  <span>- R${pricing.discountCoupon.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Desconto PIX</span>
                  <span>- R${pricing.discountPix.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Frete</span>
                  <span>{deliveryQuote.freeShipping ? 'Grátis' : `R$${deliveryFee.toFixed(2).replace('.', ',')}`}</span>
                </div>
                <div className="flex items-center justify-between font-semibold text-sm pt-1 border-t border-border">
                  <span>Total</span>
                  <span className="text-accent">R${grandTotal.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="px-4 sm:px-6 py-5 border-t border-border bg-surface shrink-0 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            {step === 'cart' ? (
              <>
                <div className="flex justify-between items-center mb-4 font-syne">
                  <span className="text-muted text-sm">Subtotal</span>
                  <span className="text-accent text-xl font-extrabold">R${cartPricing.totalFinal.toFixed(2).replace('.', ',')}</span>
                </div>
                <p className="text-[10px] text-muted mb-3">Frete calculado no próximo passo.</p>
                <button
                  type="button"
                  onClick={() => setStep('delivery')}
                  className="w-full min-h-[48px] py-3.5 bg-primary text-white font-syne font-extrabold text-base rounded-[14px] flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-[0_6px_30px_var(--primary-glow)] transition-all"
                >
                  Finalizar compra
                </button>
              </>
            ) : step === 'delivery' ? (
              <button
                type="button"
                onClick={continueFromDelivery}
                disabled={deliveryQuote.outOfZone}
                className="w-full min-h-[48px] py-3.5 bg-primary text-white font-syne font-extrabold text-base rounded-[14px] flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-[0_6px_30px_var(--primary-glow)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuar
              </button>
            ) : step === 'channel' ? null : (
              <button
                type="button"
                onClick={handleCheckout}
                disabled={loading || deliveryQuote.outOfZone}
                className="w-full min-h-[48px] py-3.5 bg-accent text-bg font-syne font-extrabold text-base rounded-[14px] flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-[0_6px_30px_var(--accent-glow)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                {loading ? 'Enviando…' : 'Enviar pedido pelo WhatsApp'}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}
