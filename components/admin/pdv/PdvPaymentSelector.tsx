'use client'

import { useState } from 'react'
import { Banknote, QrCode, CreditCard, Link2 } from 'lucide-react'
import type { PdvCartItem } from './pdv-types'
import { formatPdvCurrency } from './pdv-utils'

interface Props {
  storeId:       string
  cart:          PdvCartItem[]
  total:         number
  discount:      number
  custName:      string
  custPhone:     string
  storeHasAsaas: boolean
  storeWhatsapp: string
  onDone:        (msg: string) => void
  onBack:        () => void
}

export default function PdvPaymentSelector({
  storeId: _storeId, cart, total, discount, custName, custPhone,
  storeHasAsaas, storeWhatsapp: _storeWhatsapp, onDone, onBack,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const previewLines = cart.slice(0, 3)
  const extraCount = cart.length - previewLines.length

  async function finalize(method: 'dinheiro' | 'pix' | 'cartao') {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/pdv', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_method:  method,
          payment_source:  'PDV',
          payment_status:  'CONFIRMED',
          customer_name:   custName || 'Cliente PDV',
          customer_phone:  custPhone || '',
          items: cart.map(i => ({
            product_id: i.productId,
            variant_id: i.variantId,
            name:       i.name,
            color:      i.color,
            size:       i.size,
            qty:        i.qty,
            price:      i.price,
          })),
          total,
          discount,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erro ao registrar venda.')
        return
      }
      onDone(`Venda ${data.orderNumber} registrada — ${formatPdvCurrency(total)} em ${method}.`)
    } catch {
      setError('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  async function finalizeLink() {
    if (!custPhone.trim()) {
      setError('Informe o WhatsApp do cliente. Volte e preencha em "Identificar cliente".')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const payRes = await fetch('/api/admin/pdv/link', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name:  custName || 'Cliente PDV',
          customer_phone: custPhone,
          total,
          items: cart.map(i => ({ description: `${i.qty}x ${i.name} ${i.color} ${i.size}`, quantity: i.qty, value: i.price })),
        }),
      })
      const payData = await payRes.json()
      if (!payRes.ok) {
        setError(payData.error ?? 'Erro ao criar link de pagamento.')
        return
      }

      await fetch('/api/admin/pdv', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_method:    'link',
          payment_source:    'PDV',
          payment_status:    'PENDING',
          asaas_payment_id:  payData.asaas_payment_id,
          customer_name:     custName || 'Cliente PDV',
          customer_phone:    custPhone,
          items: cart.map(i => ({
            product_id: i.productId,
            variant_id: i.variantId,
            name:       i.name,
            color:      i.color,
            size:       i.size,
            qty:        i.qty,
            price:      i.price,
          })),
          total,
          discount,
        }),
      })

      const digits = custPhone.replace(/\D/g, '')
      const whatsappUrl = `https://wa.me/55${digits}?text=${encodeURIComponent(`Olá! Segue o link para pagamento do seu pedido: ${payData.invoiceUrl}`)}`
      window.open(whatsappUrl, '_blank')

      onDone(`Link enviado para ${custPhone} — aguardando pagamento.`)
    } catch {
      setError('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  const btnBase = 'w-full min-h-[52px] py-3 px-4 rounded-2xl border-2 text-left transition-colors disabled:opacity-50'

  return (
    <div className="space-y-4 min-w-0">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="min-h-[44px] px-2 text-muted text-sm hover:text-foreground transition-colors">
          ← Voltar
        </button>
        <h2 className="font-syne font-bold text-base">Forma de pagamento</h2>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4">
        <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Resumo</div>
        <ul className="space-y-1 text-sm mb-3">
          {previewLines.map((item, i) => (
            <li key={`${item.variantId}-${item.size}-${i}`} className="truncate text-muted" title={`${item.qty}× ${item.name} (${item.color}, ${item.size})`}>
              <span className="tabular-nums text-foreground">{item.qty}×</span>{' '}
              {item.name}{' '}
              <span className="text-xs">({item.color}, {item.size})</span>
            </li>
          ))}
          {extraCount > 0 && (
            <li className="text-xs text-muted">+{extraCount} item{extraCount > 1 ? 's' : ''}</li>
          )}
        </ul>
        <div className="border-t border-border pt-3 text-center">
          <div className="text-muted text-xs mb-1">Total</div>
          <div className="font-syne font-extrabold text-2xl text-accent tabular-nums">{formatPdvCurrency(total)}</div>
        </div>
      </div>

      {!custPhone.trim() && storeHasAsaas && (
        <p className="text-xs text-muted break-words px-1">
          Para link de pagamento, volte e preencha o WhatsApp em &quot;Identificar cliente&quot;.
        </p>
      )}

      <div className="space-y-2">
        <button type="button" disabled={loading} onClick={() => finalize('dinheiro')} className={`${btnBase} border-accent/40 bg-accent/5 hover:bg-accent/10`}>
          <span className="font-syne font-bold block inline-flex items-center justify-center gap-2">
            <Banknote size={18} aria-hidden />
            Dinheiro
          </span>
          <span className="text-xs text-muted mt-0.5 block">Recebeu em mãos — pedido confirmado</span>
        </button>

        <button type="button" disabled={loading} onClick={() => finalize('pix')} className={`${btnBase} border-primary/30 bg-primary/5 hover:bg-primary/10`}>
          <span className="font-syne font-bold block inline-flex items-center justify-center gap-2">
            <QrCode size={18} aria-hidden />
            PIX manual
          </span>
          <span className="text-xs text-muted mt-0.5 block">Você já recebeu o PIX — pedido confirmado</span>
        </button>

        <button type="button" disabled={loading} onClick={() => finalize('cartao')} className={`${btnBase} border-border hover:border-primary/50`}>
          <span className="font-syne font-bold block inline-flex items-center justify-center gap-2">
            <CreditCard size={18} aria-hidden />
            Cartão
          </span>
          <span className="text-xs text-muted mt-0.5 block">Pagou na maquininha — pedido confirmado</span>
        </button>

        {storeHasAsaas && (
          <button type="button" disabled={loading} onClick={finalizeLink} className={`${btnBase} border-border hover:border-accent/50`}>
            <span className="font-syne font-bold block inline-flex items-center justify-center gap-2">
              <Link2 size={18} aria-hidden />
              Link de pagamento
            </span>
            <span className="text-xs text-muted mt-0.5 block">Gera link e abre WhatsApp — pedido pendente até pagamento</span>
          </button>
        )}
      </div>

      {loading && <p className="text-center text-muted text-sm animate-pulse">Processando…</p>}
      {error && (
        <div className="p-3 bg-warm/10 border border-warm/30 rounded-xl text-sm text-warm break-words">{error}</div>
      )}
    </div>
  )
}
