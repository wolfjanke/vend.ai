'use client'

import Link from 'next/link'
import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PlanSlug, StoreSettings } from '@/types'
import type { CheckoutRates } from '@/lib/checkout-rates'
import { calculateInstallmentQuote, type InterestBearer } from '@/lib/payments/installment-fees'
import { calculateCheckoutMarketingPricing } from '@/lib/checkout/marketing-pricing'
import CheckoutCustomerForm, { validateCustomerFields, type FieldErrors } from './CheckoutCustomerForm'
import CheckoutPaymentSection from './CheckoutPaymentSection'
import CardPayment, { type CardPaymentHandle } from './CardPayment'
import OrderSummary from './OrderSummary'
import PixPayment from './PixPayment'

interface CartItem {
  product_id: string
  variant_id: string
  name:       string
  size:       string
  color:      string
  qty:        number
  price:      number
  photo?:     string
}

interface Props {
  storeSlug:          string
  storeName:          string
  plan:               PlanSlug
  rates:              CheckoutRates
  asaasEnv:           'sandbox' | 'production'
  items:              CartItem[]
  grossValue:         number
  storeSettings?:     StoreSettings
  initialCouponCode?: string
}

type PaymentMethod = 'PIX' | 'CREDIT_CARD'
type Step = 'form' | 'processing' | 'pix_waiting' | 'error'

interface PixData {
  paymentId:     string
  statusToken:   string
  pixQrCode:     string
  pixCopiaECola: string
  orderNumber:   string
  total:         number
}

export default function CheckoutForm({
  storeSlug,
  storeName,
  plan,
  rates,
  asaasEnv,
  items,
  grossValue,
  storeSettings = {},
  initialCouponCode = '',
}: Props) {
  const router = useRouter()
  const cardRef = useRef<CardPaymentHandle | null>(null)

  const [method, setMethod]               = useState<PaymentMethod>('PIX')
  const [installments, setInstallments]   = useState(1)
  const [interestBearer, setInterestBearer] = useState<InterestBearer>('customer')
  const [name, setName]                   = useState('')
  const [cpf, setCpf]                     = useState('')
  const [email, setEmail]                 = useState('')
  const [phone, setPhone]                 = useState('')
  const [couponCode, setCouponCode]       = useState(initialCouponCode)
  const [fieldErrors, setFieldErrors]     = useState<FieldErrors>({})
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const [step, setStep]                   = useState<Step>('form')
  const [pixData, setPixData]             = useState<PixData | null>(null)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)

  const pricing = useMemo(
    () =>
      calculateCheckoutMarketingPricing({
        items,
        billingType: method,
        couponCode,
        settings:    storeSettings,
      }),
    [items, method, couponCode, storeSettings],
  )

  const payableBase = pricing.totalFinal
  const quote = calculateInstallmentQuote(payableBase, installments, plan, rates, { interestBearer })

  function runValidation() {
    const errs = validateCustomerFields(name, cpf, email, phone)
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  function goToSuccess(orderNumber: string, total: number) {
    try {
      sessionStorage.removeItem(`cart_${storeSlug}`)
      sessionStorage.removeItem(`checkout_meta_${storeSlug}`)
    } catch { /* ignore */ }
    const q = new URLSearchParams({
      order: orderNumber,
      total: String(total),
    })
    router.push(`/${storeSlug}/checkout/sucesso?${q}`)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!runValidation()) return
    if (!privacyAccepted) {
      setError('Aceite a política de privacidade para continuar')
      return
    }

    setLoading(true)
    setStep('processing')
    setError(null)

    let creditCardToken: string | undefined

    try {
      if (method === 'CREDIT_CARD') {
        try {
          creditCardToken = await cardRef.current?.tokenize()
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Dados do cartão inválidos.')
          setStep('form')
          setLoading(false)
          return
        }
      }

      const res = await fetch(`/api/checkout/${storeSlug}/create`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billingType:    method,
          installments,
          grossValue,
          payableValue:   payableBase,
          couponCode:     couponCode.trim() || undefined,
          interestBearer,
          creditCardToken,
          cartItems: items.map(i => ({
            product_id: i.product_id,
            variant_id: i.variant_id,
            size:       i.size,
            color:      i.color,
            qty:        i.qty,
            name:       i.name,
            photo:      i.photo,
          })),
          customer: {
            name:        name.trim(),
            cpfCnpj:     cpf,
            email:       email.trim(),
            mobilePhone: phone,
          },
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Erro ao processar pagamento.')
        setStep('error')
        return
      }

      if (method === 'PIX') {
        setPixData({
          paymentId:     data.paymentId ?? data.asaas_payment_id,
          statusToken:   data.statusToken ?? '',
          pixQrCode:     data.pixQrCode ?? '',
          pixCopiaECola: data.pixCopiaECola ?? '',
          orderNumber:   data.orderNumber,
          total:         data.totalComJuros ?? quote.totalComJuros,
        })
        setStep('pix_waiting')
      } else if (data.cardConfirmed) {
        goToSuccess(data.orderNumber, data.totalComJuros ?? quote.totalComJuros)
      } else {
        goToSuccess(data.orderNumber, data.totalComJuros ?? quote.totalComJuros)
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'pix_waiting' && pixData) {
    return (
      <div className="max-w-lg mx-auto">
        <PixPayment
          storeSlug={storeSlug}
          paymentId={pixData.paymentId}
          statusToken={pixData.statusToken}
          pixQrCode={pixData.pixQrCode}
          pixCopiaECola={pixData.pixCopiaECola}
          orderNumber={pixData.orderNumber}
          total={pixData.total}
          onConfirmed={() => goToSuccess(pixData.orderNumber, pixData.total)}
        />
      </div>
    )
  }

  if (step === 'processing') {
    return (
      <div className="text-center py-20">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted text-sm">Processando pagamento…</p>
      </div>
    )
  }

  const pixDiscountPercent = Number(storeSettings.pixDiscountPercent ?? 0)

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="order-1 lg:order-1">
          <OrderSummary
            items={items}
            subtotal={pricing.subtotal}
            discountCoupon={pricing.discountCoupon}
            discountPix={pricing.discountPix}
            payableBase={payableBase}
            totalComJuros={quote.totalComJuros}
            cardFeeLabel={method === 'CREDIT_CARD' && interestBearer === 'customer' ? 'Taxa do cartão' : null}
          />
        </div>

        <div className="order-2 lg:order-2 space-y-4">
          <CheckoutCustomerForm
            name={name}
            cpf={cpf}
            email={email}
            phone={phone}
            errors={fieldErrors}
            onName={setName}
            onCpf={setCpf}
            onEmail={setEmail}
            onPhone={setPhone}
            onValidate={runValidation}
          />

          <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
            <label htmlFor="checkout-coupon" className="text-xs font-bold text-muted uppercase tracking-wider">
              Cupom (opcional)
            </label>
            <input
              id="checkout-coupon"
              type="text"
              value={couponCode}
              onChange={e => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Ex: BEMVINDO10"
              className="w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-sm uppercase"
            />
            {method === 'PIX' && pixDiscountPercent > 0 && (
              <p className="text-[11px] text-muted break-words">
                Desconto PIX de {pixDiscountPercent}% aplicado automaticamente no total.
              </p>
            )}
          </div>

          <CheckoutPaymentSection
            method={method}
            installments={installments}
            grossValue={payableBase}
            plan={plan}
            rates={rates}
            interestBearer={interestBearer}
            onMethod={setMethod}
            onInstallments={setInstallments}
            onInterestBearer={setInterestBearer}
            cardFields={
              method === 'CREDIT_CARD' ? (
                <CardPayment ref={cardRef} asaasEnv={asaasEnv} onError={setError} />
              ) : undefined
            }
          />

          <label className="flex gap-2.5 items-start text-xs text-muted cursor-pointer min-w-0">
            <input
              type="checkbox"
              checked={privacyAccepted}
              onChange={e => setPrivacyAccepted(e.target.checked)}
              className="mt-0.5 shrink-0 min-w-[18px] min-h-[18px]"
            />
            <span className="break-words min-w-0">
              Li e aceito a{' '}
              <Link href="/privacidade" target="_blank" className="text-primary underline">
                Política de Privacidade
              </Link>
              {' '}para processar este pagamento.
            </span>
          </label>

          {(error || step === 'error') && error && (
            <div className="p-3 bg-warm/10 border border-warm/30 rounded-xl text-sm text-warm break-words">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[44px] py-3.5 bg-primary text-white font-syne font-bold text-sm rounded-xl hover:shadow-[0_4px_20px_var(--primary-glow)] transition-all disabled:opacity-70 disabled:cursor-wait"
          >
            {method === 'PIX'
              ? 'Gerar QR Code'
              : `Finalizar pedido — ${installments}x`}
          </button>
        </div>
      </div>
    </form>
  )
}
