'use client'

import { useState } from 'react'
import { Smartphone } from 'lucide-react'
import type { Order } from '@/types'
import { formatPhoneDisplay, whatsappWaMeDigits } from '@/lib/masks'

const SUGESTOES = [
  { label: 'Parcelar em 2x', texto: 'Olá! Vi que você montou um pedido e não finalizou. Posso parcelar em 2x sem juros para você. Quer que eu reserve?' },
  { label: '10% desconto', texto: 'Olá! Que tal 10% de desconto para fechar seu pedido hoje? É por tempo limitado!' },
  { label: 'Entrega grátis', texto: 'Olá! Retirada na loja sai com frete grátis. Quer que eu feche seu pedido com essa condição?' },
]

interface Props {
  order: Order
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const hrs = Math.floor(diff / 36e5)
  if (hrs < 24) return `há ${hrs}h`
  return `há ${Math.floor(hrs / 24)}d`
}

export default function RecoveryCard({ order }: Props) {
  const [enviado, setEnviado] = useState(false)
  const [customText, setCustomText] = useState('')
  const [loading, setLoading] = useState(false)

  async function marcarEnviado() {
    setLoading(true)
    try {
      await fetch(`/api/pedidos/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recovery_sent_at: true }),
      })
      setEnviado(true)
    } finally {
      setLoading(false)
    }
  }

  function abrirWhatsApp(texto: string) {
    const msg = encodeURIComponent(texto.trim() || 'Olá! Vi que você deixou itens no carrinho. Posso te ajudar a finalizar o pedido?')
    window.open(`https://wa.me/${whatsappWaMeDigits(order.customer_whatsapp)}?text=${msg}`, '_blank')
    marcarEnviado()
  }

  if (enviado) return null

  return (
    <div className="bg-surface border border-warm/30 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-1 rounded-lg">#{order.order_number}</span>
        <span className="text-[11px] text-muted">{timeAgo(order.created_at)}</span>
      </div>
      <div className="font-semibold text-sm mb-1">{order.customer_name}</div>
      <a href={`https://wa.me/${whatsappWaMeDigits(order.customer_whatsapp)}`} target="_blank" rel="noreferrer" className="text-accent text-xs mb-3 inline-flex items-center gap-1.5 hover:underline">
        <Smartphone size={13} className="shrink-0" aria-hidden />
        {formatPhoneDisplay(order.customer_whatsapp)}
      </a>
      <div className="text-muted text-xs mb-3 leading-relaxed">
        {order.items_json.map((item, i) => (
          <div key={i}>• {item.name}{item.color ? ` — ${item.color}` : ''} — {item.size} ({item.qty}x) — R${item.price.toFixed(2).replace('.', ',')}</div>
        ))}
      </div>
      <div className="text-accent font-bold text-base mb-3">R$ {order.total.toFixed(2).replace('.', ',')}</div>
      <div className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Sugestões de mensagem</div>
      <div className="flex flex-wrap gap-2 mb-3">
        {SUGESTOES.map(s => (
          <button
            key={s.label}
            type="button"
            onClick={() => abrirWhatsApp(s.texto)}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg border border-primary/40 text-primary text-xs font-semibold hover:bg-primary/20 transition-all disabled:opacity-50"
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Ou escreva sua mensagem..."
          value={customText}
          onChange={e => setCustomText(e.target.value)}
          className="flex-1 min-w-0 px-3 py-2 bg-surface2 border border-border rounded-lg text-foreground text-xs outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={() => abrirWhatsApp(customText)}
          disabled={loading}
          className="px-4 py-2 bg-accent text-bg rounded-lg text-xs font-bold hover:shadow-[0_4px_20px_var(--accent-glow)] transition-all disabled:opacity-50"
        >
          Enviar no WhatsApp
        </button>
      </div>
    </div>
  )
}
