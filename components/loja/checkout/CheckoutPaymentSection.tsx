'use client'

import type { PlanSlug } from '@/types'
import type { CheckoutRates } from '@/lib/checkout-rates'
import { calculateInstallmentQuote, getFaixa, type InterestBearer } from '@/lib/payments/installment-fees'
type PaymentMethod = 'PIX' | 'CREDIT_CARD'

interface Props {
  method:           PaymentMethod
  installments:     number
  grossValue:       number
  plan:             PlanSlug
  rates:            CheckoutRates
  interestBearer:   InterestBearer
  onMethod:         (m: PaymentMethod) => void
  onInstallments:   (n: number) => void
  onInterestBearer: (b: InterestBearer) => void
  cardFields?:      React.ReactNode
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function CheckoutPaymentSection({
  method, installments, grossValue, plan, rates, interestBearer,
  onMethod, onInstallments, onInterestBearer, cardFields,
}: Props) {
  const quote = calculateInstallmentQuote(grossValue, installments, plan, rates, { interestBearer })

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 space-y-4">
      <h3 className="font-syne font-bold text-sm">Pagamento</h3>

      <div className="grid grid-cols-2 gap-2">
        {(['PIX', 'CREDIT_CARD'] as PaymentMethod[]).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => { onMethod(m); if (m === 'PIX') onInstallments(1) }}
            className={`min-h-[44px] py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
              method === m ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted hover:border-primary/50'
            }`}
          >
            {m === 'PIX' ? 'PIX' : 'Cartão de crédito'}
          </button>
        ))}
      </div>

      {method === 'CREDIT_CARD' && (
        <>
          <div className="flex items-center justify-between gap-3 p-3 bg-surface2 rounded-xl">
            <span className="text-xs text-muted break-words">Parcelamento</span>
            <div className="flex gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onInterestBearer('merchant')}
                className={`text-xs px-2.5 py-1.5 rounded-lg border min-h-[36px] ${
                  interestBearer === 'merchant'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted'
                }`}
              >
                Sem juros
              </button>
              <button
                type="button"
                onClick={() => onInterestBearer('customer')}
                className={`text-xs px-2.5 py-1.5 rounded-lg border min-h-[36px] ${
                  interestBearer === 'customer'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted'
                }`}
              >
                Com juros
              </button>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-2">
              Parcelas
            </label>
            <select
              value={installments}
              onChange={e => onInstallments(Number(e.target.value))}
              className="w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-sm outline-none focus:border-primary"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(n => {
                const q = calculateInstallmentQuote(grossValue, n, plan, rates, { interestBearer })
                return (
                  <option key={n} value={n}>
                    {n}x de {formatCurrency(q.installmentValue)} — total {formatCurrency(q.totalComJuros)}
                  </option>
                )
              })}
            </select>
            {installments >= 4 && (
              <p className="text-[10px] text-warm mt-1.5 break-words">
                Faixa {getFaixa(installments)}: taxa de {(quote.platformTakePct).toFixed(1)}% sobre o valor.
              </p>
            )}
          </div>

          {cardFields}
        </>
      )}

      <div className="pt-3 border-t border-border text-sm">
        {method === 'PIX' ? (
          <div className="flex justify-between gap-2">
            <span className="text-muted">Total PIX</span>
            <span className="font-bold text-accent tabular-nums">{formatCurrency(quote.totalComJuros)}</span>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex justify-between gap-2">
              <span className="text-muted">{installments}x de</span>
              <span className="font-bold text-accent tabular-nums">{formatCurrency(quote.installmentValue)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted gap-2">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(quote.totalComJuros)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
