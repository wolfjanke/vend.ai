'use client'

import { useState } from 'react'

interface CartItem {
  productId: string
  variantId: string
  name:      string
  color:     string
  size:      string
  price:     number
  qty:       number
}

interface Props {
  storeId:       string
  cart:          CartItem[]
  total:         number
  discount:      number
  custName:      string
  custPhone:     string
  storeHasAsaas: boolean
  storeWhatsapp: string
  onDone:        (msg: string) => void
  onBack:        () => void
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function PdvPaymentSelector({
  storeId, cart, total, discount, custName, custPhone,
  storeHasAsaas, storeWhatsapp, onDone, onBack,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

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
      onDone(`Venda ${data.orderNumber} registrada — ${formatCurrency(total)} em ${method}.`)
    } catch {
      setError('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  async function finalizeLink() {
    if (!custPhone) {
      setError('Informe o WhatsApp do cliente para enviar o link.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      // 1. Criar cobrança no Asaas (via checkout/payment com storeSlug)
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

      // 2. Registrar pedido como PENDING
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

      // 3. Abrir WhatsApp com o link
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
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="text-muted text-sm hover:text-foreground transition-colors">
          ← Voltar
        </button>
        <h2 className="font-syne font-bold text-base">Forma de pagamento</h2>
      </div>
      <div className="bg-surface border border-border rounded-2xl p-4 text-center">
        <div className="text-muted text-xs mb-1">Total</div>
        <div className="font-syne font-extrabold text-2xl text-accent tabular-nums">{formatCurrency(total)}</div>
      </div>

      <div className="space-y-2">
        <button type="button" disabled={loading} onClick={() => finalize('dinheiro')} className={`${btnBase} border-accent/40 bg-accent/5 hover:bg-accent/10`}>
          <span className="font-syne font-bold block">💵 Dinheiro</span>
          <span className="text-xs text-muted mt-0.5 block">Recebeu em mãos — pedido confirmado</span>
        </button>

        <button type="button" disabled={loading} onClick={() => finalize('pix')} className={`${btnBase} border-primary/30 bg-primary/5 hover:bg-primary/10`}>
          <span className="font-syne font-bold block">💠 PIX manual</span>
          <span className="text-xs text-muted mt-0.5 block">Você já recebeu o PIX — pedido confirmado</span>
        </button>

        <button type="button" disabled={loading} onClick={() => finalize('cartao')} className={`${btnBase} border-border hover:border-primary/50`}>
          <span className="font-syne font-bold block">💳 Cartão</span>
          <span className="text-xs text-muted mt-0.5 block">Pagou na maquininha — pedido confirmado</span>
        </button>

        {storeHasAsaas && (
          <button type="button" disabled={loading} onClick={finalizeLink} className={`${btnBase} border-border hover:border-accent/50`}>
            <span className="font-syne font-bold block">🔗 Link de pagamento</span>
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
