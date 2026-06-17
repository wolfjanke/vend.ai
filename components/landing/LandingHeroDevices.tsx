'use client'

import { useEffect, useState } from 'react'
import {
  Shirt,
  Sparkles,
  ShoppingBag,
  type LucideIcon,
} from 'lucide-react'
import { BRAND } from '@/lib/brand'

const ROTATE_MS = 5500

type HeroCard = { Icon: LucideIcon; name: string; price: string }

const VARIANTS = [
  {
    storeName: 'Urban Mix',
    slug: 'urban-mix',
    cards: [
      { Icon: Shirt, name: 'Saia Midi', price: 'R$109' },
      { Icon: Shirt, name: 'Camiseta', price: 'R$79' },
      { Icon: ShoppingBag, name: 'Jaqueta', price: 'R$189' },
    ] satisfies HeroCard[],
    userBubble: 'Bermuda M pra homem',
    assistantBubble: 'Achei 2 opções!',
  },
  {
    storeName: 'Urban Mix',
    slug: 'urban-mix',
    cards: [
      { Icon: Sparkles, name: 'Conjunto', price: 'R$199' },
      { Icon: Shirt, name: 'Bermuda', price: 'R$99' },
      { Icon: Shirt, name: 'Tie-Dye', price: 'R$69' },
    ] satisfies HeroCard[],
    userBubble: 'Vestido festa tamanho P',
    assistantBubble: 'Encontrei 2 opções!',
  },
  {
    storeName: 'Urban Mix',
    slug: 'urban-mix',
    cards: [
      { Icon: ShoppingBag, name: 'Calça Slim', price: 'R$189' },
      { Icon: ShoppingBag, name: 'Moletom', price: 'R$149' },
      { Icon: Shirt, name: 'Vestido', price: 'R$189' },
    ] satisfies HeroCard[],
    userBubble: 'Tem desconto no PIX?',
    assistantBubble: '5% no PIX sim!',
  },
] as const

export default function LandingHeroDevices() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex(i => (i + 1) % VARIANTS.length)
    }, ROTATE_MS)
    return () => window.clearInterval(id)
  }, [])

  const v = VARIANTS[index]

  return (
    <div
      className="hidden lg:flex flex-shrink-0 flex-1 min-w-0 max-w-[min(100%,560px)] justify-end items-end animate-fade-up"
      style={{ animationDelay: '0.15s' }}
      aria-live="polite"
      aria-label="Prévia da loja no computador e no celular"
    >
      <div className="relative w-full max-w-[520px] h-[min(42vw,400px)] min-h-[320px]">
        {/* Monitor — atrás, à direita */}
        <div className="absolute right-0 top-0 w-[88%] max-w-[440px] z-0 transition-opacity duration-500" key={`desk-${index}`}>
          <div className="rounded-t-xl border border-border bg-gradient-to-b from-surface3 via-surface2 to-surface2 p-2 pb-0 shadow-[0_24px_60px_rgba(0,0,0,0.45),0_0_0_1px_#7B6EFF18]">
            <div className="rounded-t-lg bg-bg border border-border overflow-hidden">
              {/* Barra do navegador */}
              <div className="flex items-center gap-2 px-3 py-2 bg-surface2 border-b border-border min-w-0">
                <div className="flex gap-1 shrink-0" aria-hidden>
                  <span className="w-2 h-2 rounded-full bg-warm/50" />
                  <span className="w-2 h-2 rounded-full bg-yellow-500/40" />
                  <span className="w-2 h-2 rounded-full bg-accent/50" />
                </div>
                <div className="flex-1 min-w-0 text-center">
                  <span className="text-[10px] text-muted font-mono truncate block">
                    {BRAND.domain}/{v.slug}
                  </span>
                </div>
              </div>
              {/* Área “desktop” */}
              <div className="aspect-[16/10] p-2.5 sm:p-3 bg-bg flex flex-col gap-2 min-h-0">
                <div className="text-center min-w-0 shrink-0">
                  <div className="w-10 h-10 mx-auto rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-[10px] font-bold text-primary mb-1">
                    SM
                  </div>
                  <div className="text-[10px] font-semibold text-foreground truncate">{v.storeName}</div>
                </div>
                <div className="grid grid-cols-3 gap-1.5 flex-1 min-h-0">
                  {v.cards.map(({ Icon, name, price }) => (
                    <div
                      key={name}
                      className="bg-surface border border-border rounded-lg p-1.5 flex flex-col items-center text-center min-w-0"
                    >
                      <Icon size={16} className="text-muted mb-0.5 shrink-0" aria-hidden />
                      <div className="text-[9px] text-foreground truncate w-full">{name}</div>
                      <div className="text-[9px] text-accent font-bold tabular-nums">{price}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 items-stretch shrink-0">
                  <div className="flex-1 min-w-0 rounded-lg border border-primary/25 bg-primary/5 px-2 py-1.5 flex items-center gap-1.5">
                    <span className="text-[9px] text-muted shrink-0">Vi</span>
                    <span className="text-[9px] text-foreground/90 truncate">Posso ajudar a escolher tamanho e cor ✦</span>
                  </div>
                  <div className="shrink-0 rounded-lg bg-accent/15 border border-accent/30 px-2 py-1 flex items-center">
                    <span className="text-[8px] font-bold text-accent whitespace-nowrap">WhatsApp</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Base do monitor */}
          <div className="h-2.5 bg-gradient-to-b from-surface3 to-surface2 mx-[12%] rounded-b-sm border-x border-b border-border" />
          <div className="h-1.5 bg-border/80 mx-[28%] rounded-b-md mb-0.5" />
        </div>

        {/* Celular — na frente, à esquerda do cluster */}
        <div className="absolute left-0 bottom-0 z-10 w-52 drop-shadow-[0_20px_50px_rgba(0,0,0,0.55)]">
          <div className="w-full bg-surface border border-border rounded-[32px] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.5),0_0_0_1px_#7B6EFF22]">
            <div className="bg-surface2 rounded-[20px] p-3 overflow-hidden">
              <div className="text-center mb-2.5 min-w-0">
                <div className="w-12 h-12 mx-auto rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-[10px] font-bold text-primary mb-1.5">
                  SM
                </div>
                <span className="text-[10px] text-foreground font-semibold truncate block px-1" title={v.storeName}>
                  {v.storeName}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 mb-2.5 min-w-0" key={`m-cards-${index}`}>
                {v.cards.map(({ Icon, name, price }) => (
                  <div
                    key={name}
                    className="min-w-0 bg-surface rounded-[10px] p-1.5 border border-border text-center"
                  >
                    <Icon size={18} className="text-muted mx-auto mb-0.5 shrink-0" aria-hidden />
                    <div className="text-[9px] text-foreground truncate">{name}</div>
                    <div className="text-accent text-[10px] font-bold tabular-nums">{price}</div>
                  </div>
                ))}
              </div>
              <div className="bg-bg rounded-[10px] p-2 flex flex-col gap-1.5 mb-2.5" key={`m-chat-${index}`}>
                <div className="bg-surface2 text-[10px] px-2 py-1 rounded-lg rounded-bl-[2px] self-start max-w-[80%] break-words">
                  Olá! Posso te ajudar? ✦
                </div>
                <div className="bg-primary/20 border border-primary/30 text-[10px] px-2 py-1 rounded-lg rounded-br-[2px] self-end max-w-[80%] break-words">
                  {v.userBubble}
                </div>
                <div className="bg-surface2 text-[10px] px-2 py-1 rounded-lg rounded-bl-[2px] self-start max-w-[80%] break-words">
                  {v.assistantBubble}
                </div>
              </div>
              <div className="bg-accent text-bg text-[10px] font-bold text-center py-1.5 rounded-lg font-syne">
                Finalizar pelo WhatsApp
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
