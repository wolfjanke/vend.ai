'use client'

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
  items:            CartItem[]
  subtotal:         number
  discountCoupon?:  number
  discountPix?:     number
  payableBase:      number
  totalComJuros?:   number
  cardFeeLabel?:    string | null
  /** @deprecated use subtotal */
  grossValue?:      number
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function OrderSummary({
  items,
  subtotal,
  discountCoupon = 0,
  discountPix = 0,
  payableBase,
  totalComJuros,
  cardFeeLabel,
}: Props) {
  const total = totalComJuros ?? payableBase
  const cardFeeAmount = totalComJuros != null && totalComJuros > payableBase
    ? totalComJuros - payableBase
    : 0

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 lg:sticky lg:top-20">
      <h2 className="font-syne font-bold text-base sm:text-lg mb-4">Resumo do pedido</h2>
      <ul className="space-y-3 mb-4">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 min-w-0">
            {item.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.photo}
                alt=""
                className="w-14 h-14 rounded-xl object-cover shrink-0 border border-border"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-surface2 border border-border shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate" title={item.name}>{item.name}</p>
              <p className="text-xs text-muted break-words">
                {item.size && `Tam. ${item.size}`}
                {item.size && item.color ? ' · ' : ''}
                {item.color && `Cor: ${item.color}`}
              </p>
              <p className="text-xs text-muted">Qtd: {item.qty}</p>
            </div>
            <span className="text-sm font-semibold tabular-nums shrink-0">
              {formatCurrency(item.price * item.qty)}
            </span>
          </li>
        ))}
      </ul>
      <div className="border-t border-border pt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-2">
          <span className="text-muted">Subtotal</span>
          <span className="tabular-nums">{formatCurrency(subtotal)}</span>
        </div>
        {discountCoupon > 0 && (
          <div className="flex justify-between gap-2">
            <span className="text-muted">Desconto cupom</span>
            <span className="tabular-nums text-accent">- {formatCurrency(discountCoupon)}</span>
          </div>
        )}
        {discountPix > 0 && (
          <div className="flex justify-between gap-2">
            <span className="text-muted">Desconto PIX</span>
            <span className="tabular-nums text-accent">- {formatCurrency(discountPix)}</span>
          </div>
        )}
        {cardFeeAmount > 0 && (
          <div className="flex justify-between gap-2">
            <span className="text-muted break-words">{cardFeeLabel ?? 'Taxa do cartão'}</span>
            <span className="tabular-nums">{formatCurrency(cardFeeAmount)}</span>
          </div>
        )}
        <div className="flex justify-between gap-2 font-bold text-base pt-1">
          <span>Total</span>
          <span className="text-accent tabular-nums">{formatCurrency(total)}</span>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-2 text-[10px] text-muted">
        <span className="px-2 py-1 bg-surface2 rounded-lg">Pagamento seguro</span>
        <span className="px-2 py-1 bg-surface2 rounded-lg">Dados criptografados</span>
      </div>
    </div>
  )
}
