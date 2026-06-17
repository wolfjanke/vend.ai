'use client'

import { Shirt } from 'lucide-react'

/** Prévia compacta da vitrine no hero — visível só abaixo de `lg`. */
export default function LandingHeroMobile() {
  const cards = [
    { name: 'Tênis', price: 'R$129' },
    { name: 'Saia', price: 'R$89' },
    { name: 'Bolsa', price: 'R$149' },
  ]

  return (
    <div
      className="flex lg:hidden justify-center w-full min-w-0 mt-6 animate-fade-up"
      style={{ animationDelay: '0.12s' }}
      aria-hidden
    >
      <div className="w-full max-w-[280px] bg-surface border border-border rounded-[28px] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
        <div className="bg-surface2 rounded-[20px] p-3 overflow-hidden">
          <div className="text-center mb-3 min-w-0">
            <div className="w-14 h-14 mx-auto rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm mb-2">
              SM
            </div>
            <div className="text-xs font-semibold text-foreground truncate px-2">Sua Marca Store</div>
            <div className="text-[10px] text-muted truncate px-2 mt-0.5">Qualidade que você confia</div>
          </div>
          <div className="h-8 rounded-xl bg-surface border border-border mb-3 flex items-center px-3 gap-2 min-w-0">
            <span className="text-muted text-[10px]" aria-hidden>⌕</span>
            <span className="text-[10px] text-muted truncate">Buscar produtos…</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 mb-3 min-w-0">
            {cards.map(({ name, price }) => (
              <div key={name} className="bg-surface rounded-[10px] p-1.5 border border-border text-center min-w-0">
                <Shirt size={16} className="text-muted mx-auto mb-0.5 shrink-0" aria-hidden />
                <div className="text-[9px] text-foreground truncate">{name}</div>
                <div className="text-accent text-[10px] font-bold tabular-nums">{price}</div>
              </div>
            ))}
          </div>
          <div className="bg-bg rounded-[10px] p-2 flex flex-col gap-1.5 mb-2">
            <div className="bg-surface2 text-[10px] px-2 py-1 rounded-lg self-start max-w-[85%] break-words">
              Olá! Posso te ajudar? ✦
            </div>
            <div className="bg-primary/20 border border-primary/30 text-[10px] px-2 py-1 rounded-lg self-end max-w-[85%] break-words">
              Tem no P?
            </div>
          </div>
          <div className="bg-accent text-bg text-[10px] font-bold text-center py-2 rounded-lg font-syne">
            Finalizar pelo WhatsApp
          </div>
        </div>
      </div>
    </div>
  )
}
