'use client'

import type { PdvCartItem, PdvDiscType } from './pdv-types'
import { formatPdvCurrency } from './pdv-utils'

interface Props {
  cart:            PdvCartItem[]
  subtotal:        number
  discount:        string
  discType:        PdvDiscType
  discountAmount:  number
  total:           number
  custName:        string
  custPhone:       string
  onDiscountChange: (v: string) => void
  onDiscTypeChange: (v: PdvDiscType) => void
  onCustNameChange: (v: string) => void
  onCustPhoneChange: (v: string) => void
  onQtyChange:     (idx: number, delta: number) => void
  onRemove:        (idx: number) => void
  onFinalize:      () => void
  showFinalizeButton?: boolean
}

export default function PdvCartPanel({
  cart,
  subtotal,
  discount,
  discType,
  discountAmount,
  total,
  custName,
  custPhone,
  onDiscountChange,
  onDiscTypeChange,
  onCustNameChange,
  onCustPhoneChange,
  onQtyChange,
  onRemove,
  onFinalize,
  showFinalizeButton = true,
}: Props) {
  const hasItems = cart.length > 0

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 xl:sticky xl:top-24 min-w-0">
      <div className="font-syne font-bold text-sm mb-3">Itens da venda</div>

      {hasItems ? (
        <div className="space-y-2 mb-4">
          {cart.map((item, i) => (
            <div key={`${item.variantId}-${item.size}-${i}`} className="flex items-center gap-2 text-sm min-w-0">
              <div className="flex-1 min-w-0">
                <div className="truncate font-medium" title={item.name}>{item.name}</div>
                <div className="text-xs text-muted truncate">{item.color} — {item.size}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onQtyChange(i, -1)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-border hover:border-primary text-sm"
                  aria-label="Diminuir quantidade"
                >
                  −
                </button>
                <span className="w-6 text-center tabular-nums">{item.qty}</span>
                <button
                  type="button"
                  onClick={() => onQtyChange(i, 1)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-border hover:border-primary text-sm"
                  aria-label="Aumentar quantidade"
                >
                  +
                </button>
              </div>
              <span className="text-accent tabular-nums shrink-0 w-[4.5rem] text-right">
                {formatPdvCurrency(item.price * item.qty)}
              </span>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-warm text-sm hover:bg-warm/10 rounded-lg shrink-0"
                aria-label="Remover item"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 px-2 mb-4 border border-dashed border-border rounded-xl">
          <p className="text-muted text-sm break-words">
            Nenhum item — busque e selecione cor e tamanho.
          </p>
        </div>
      )}

      {hasItems && (
        <div className="flex justify-between text-sm text-muted mb-3">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatPdvCurrency(subtotal)}</span>
        </div>
      )}

      <details className="mb-3 group">
        <summary className="text-sm font-semibold text-muted cursor-pointer list-none flex items-center gap-2 min-h-[44px] [&::-webkit-details-marker]:hidden">
          <span className="text-primary group-open:rotate-90 transition-transform inline-block">›</span>
          Aplicar desconto
        </summary>
        <div className="flex gap-2 mt-2 pl-4">
          <div className="flex-1 min-w-0">
            <input
              className="w-full min-h-[44px] px-3 py-2 bg-surface2 border border-border rounded-xl text-sm outline-none focus:border-primary transition-all"
              placeholder={discType === 'pct' ? '10' : '0,00'}
              value={discount}
              onChange={e => onDiscountChange(e.target.value)}
            />
          </div>
          <select
            className="min-h-[44px] px-3 py-2 bg-surface2 border border-border rounded-xl text-sm outline-none focus:border-primary transition-all shrink-0"
            value={discType}
            onChange={e => onDiscTypeChange(e.target.value as PdvDiscType)}
            aria-label="Tipo de desconto"
          >
            <option value="fixed">R$</option>
            <option value="pct">%</option>
          </select>
        </div>
      </details>

      <div className="border-t border-border pt-3 mb-3">
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-accent mb-1">
            <span>Desconto</span>
            <span className="tabular-nums">−{formatPdvCurrency(discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between items-baseline gap-2">
          <span className="font-syne font-bold text-sm">Total</span>
          <span className="font-syne font-extrabold text-xl sm:text-2xl text-accent tabular-nums">
            {formatPdvCurrency(total)}
          </span>
        </div>
      </div>

      <details className="mb-4 group">
        <summary className="text-sm font-semibold text-muted cursor-pointer list-none flex items-center gap-2 min-h-[44px] [&::-webkit-details-marker]:hidden">
          <span className="text-primary group-open:rotate-90 transition-transform inline-block">›</span>
          Identificar cliente (opcional)
        </summary>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 pl-4">
          <div className="min-w-0">
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">Nome</label>
            <input
              className="w-full min-h-[44px] px-3 py-2 bg-surface2 border border-border rounded-xl text-sm outline-none focus:border-primary transition-all"
              value={custName}
              onChange={e => onCustNameChange(e.target.value)}
              placeholder="Nome do cliente"
            />
          </div>
          <div className="min-w-0">
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">WhatsApp</label>
            <input
              className="w-full min-h-[44px] px-3 py-2 bg-surface2 border border-border rounded-xl text-sm outline-none focus:border-primary transition-all"
              value={custPhone}
              onChange={e => onCustPhoneChange(e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>
        </div>
      </details>

      {showFinalizeButton && (
        <button
          type="button"
          disabled={!hasItems}
          onClick={onFinalize}
          className="hidden xl:flex w-full min-h-[44px] py-3.5 bg-primary text-white font-syne font-bold text-sm rounded-xl hover:shadow-[0_4px_20px_var(--primary-glow)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none items-center justify-center"
        >
          {hasItems ? `Finalizar venda — ${formatPdvCurrency(total)}` : 'Finalizar venda'}
        </button>
      )}
    </div>
  )
}
