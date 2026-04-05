'use client'

import { useState } from 'react'
import type { PlanSlug } from '@/types'
import { calculateInstallmentQuote, getFaixa } from '@/lib/payments/installment-fees'
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
  storeSlug:  string
  plan:       PlanSlug
  items:      CartItem[]
  grossValue: number
}

type PaymentMethod = 'PIX' | 'CREDIT_CARD'
type Step = 'form' | 'pix_waiting' | 'confirmed'

interface PixData {
  paymentId:     string
  pixQrCode:     string
  pixCopiaECola: string
  orderNumber:   string
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function CheckoutForm({ storeSlug, plan, items, grossValue }: Props) {
  const [method, setMethod]           = useState<PaymentMethod>('PIX')
  const [installments, setInstallments] = useState(1)
  const [name, setName]               = useState('')
  const [cpf, setCpf]                 = useState('')
  const [email, setEmail]             = useState('')
  const [phone, setPhone]             = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [step, setStep]               = useState<Step>('form')
  const [pixData, setPixData]         = useState<PixData | null>(null)

  const quote       = calculateInstallmentQuote(grossValue, installments, plan)
  const prevFaixa   = installments > 1 ? getFaixa(installments - 1) : null
  const currFaixa   = getFaixa(installments)
  const faixaMudou  = installments >= 4 && prevFaixa !== currFaixa

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Informe seu nome'); return }
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/checkout/payment', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeSlug,
          billingType:  method,
          installments,
          grossValue,
          customer: { name: name.trim(), cpfCnpj: cpf || undefined, email: email || undefined, mobilePhone: phone || undefined },
          items: items.map(i => ({ description: `${i.qty}x ${i.name} (${i.color} ${i.size})`, quantity: i.qty, value: i.price })),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Erro ao processar pagamento.')
        return
      }

      if (method === 'PIX') {
        setPixData({
          paymentId:     data.asaas_payment_id,
          pixQrCode:     data.pixQrCode ?? '',
          pixCopiaECola: data.pixCopiaECola ?? '',
          orderNumber:   data.orderNumber,
        })
        setStep('pix_waiting')
      } else {
        setStep('confirmed')
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'pix_waiting' && pixData) {
    return (
      <PixPayment
        paymentId={pixData.paymentId}
        pixQrCode={pixData.pixQrCode}
        pixCopiaECola={pixData.pixCopiaECola}
        orderNumber={pixData.orderNumber}
        onConfirmed={() => setStep('confirmed')}
      />
    )
  }

  if (step === 'confirmed') {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">✓</div>
        <h2 className="font-syne font-bold text-xl mb-2">Pagamento confirmado!</h2>
        <p className="text-muted text-sm">Você receberá a confirmação em breve.</p>
        <a href={`/${storeSlug}`} className="mt-6 inline-block text-primary text-sm font-semibold underline underline-offset-2">
          Voltar à loja
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Resumo do pedido */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <div className="font-syne font-bold text-sm mb-3">Resumo do pedido</div>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm gap-2">
              <span className="text-muted min-w-0 truncate">{item.qty}x {item.name} — {item.color} {item.size}</span>
              <span className="shrink-0 tabular-nums">{formatCurrency(item.price * item.qty)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-border mt-3 pt-3 flex justify-between font-bold">
          <span>Total</span>
          <span className="text-accent tabular-nums">{formatCurrency(grossValue)}</span>
        </div>
      </div>

      {/* Dados do comprador */}
      <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
        <div className="font-syne font-bold text-sm">Seus dados</div>
        <div>
          <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">Nome completo *</label>
          <input required className="w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-sm outline-none focus:border-primary transition-all" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">CPF (opcional)</label>
            <input className="w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-sm outline-none focus:border-primary transition-all" value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">WhatsApp</label>
            <input className="w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-sm outline-none focus:border-primary transition-all" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
          </div>
        </div>
        <div>
          <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">E-mail (opcional)</label>
          <input type="email" className="w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-sm outline-none focus:border-primary transition-all" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" />
        </div>
      </div>

      {/* Método de pagamento */}
      <div className="bg-surface border border-border rounded-2xl p-4 space-y-4">
        <div className="font-syne font-bold text-sm">Forma de pagamento</div>

        <div className="grid grid-cols-2 gap-2">
          {(['PIX', 'CREDIT_CARD'] as PaymentMethod[]).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => { setMethod(m); setInstallments(1) }}
              className={`min-h-[44px] py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
                method === m ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted hover:border-primary/50'
              }`}
            >
              {m === 'PIX' ? '💠 PIX' : '💳 Cartão'}
            </button>
          ))}
        </div>

        {/* Tabela de parcelas */}
        {method === 'CREDIT_CARD' && (
          <div>
            <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Parcelas</div>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {Array.from({ length: 12 }, (_, i) => i + 1).map(n => {
                const q = calculateInstallmentQuote(grossValue, n, plan)
                const faixa = getFaixa(n)
                const prevFaixaN = n > 1 ? getFaixa(n - 1) : null
                const mudou = n >= 4 && prevFaixaN !== faixa
                return (
                  <div key={n}>
                    {mudou && (
                      <div className="text-[10px] text-warm font-semibold px-2 py-1 bg-warm/10 border border-warm/20 rounded-lg mb-1 break-words">
                        ⚠ A partir de {n}x a taxa muda para {(q.platformTakePct).toFixed(1)}%. Parcela: {formatCurrency(q.installmentValue)}/mês.
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setInstallments(n)}
                      className={`w-full flex justify-between items-center px-3 py-2 rounded-xl text-sm transition-all ${
                        installments === n ? 'bg-primary/10 border border-primary text-primary' : 'border border-transparent hover:bg-surface2'
                      }`}
                    >
                      <span>{n}x</span>
                      <span className="font-semibold tabular-nums">{formatCurrency(q.installmentValue)}</span>
                      <span className="text-muted text-xs tabular-nums">({formatCurrency(q.totalComJuros)} total)</span>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Resumo do valor */}
        <div className="pt-3 border-t border-border">
          {method === 'PIX' ? (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">Total PIX</span>
              <span className="font-bold text-accent tabular-nums">{formatCurrency(quote.totalComJuros)}</span>
            </div>
          ) : (
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">{installments}x de</span>
                <span className="font-bold text-accent tabular-nums">{formatCurrency(quote.installmentValue)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted">
                <span>Total com juros</span>
                <span className="tabular-nums">{formatCurrency(quote.totalComJuros)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {faixaMudou && method === 'CREDIT_CARD' && (
        <div className="p-3 bg-warm/10 border border-warm/30 rounded-xl text-xs text-warm break-words">
          ⚠ A taxa muda a partir de 4 parcelas. Verifique o total antes de confirmar.
        </div>
      )}

      {error && (
        <div className="p-3 bg-warm/10 border border-warm/30 rounded-xl text-sm text-warm break-words">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full min-h-[44px] py-3.5 bg-primary text-white font-syne font-bold text-sm rounded-xl hover:shadow-[0_4px_20px_var(--primary-glow)] transition-all disabled:opacity-70 disabled:cursor-wait"
      >
        {loading ? 'Processando…' : method === 'PIX' ? 'Gerar PIX' : `Pagar ${installments}x ${formatCurrency(quote.installmentValue)}`}
      </button>
    </form>
  )
}
