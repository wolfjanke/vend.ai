'use client'

import { useEffect, useState } from 'react'

const ROTATE_MS = 5500

const VARIANTS = [
  {
    storeName: 'Urban Mix',
    slug: 'urban-mix',
    cards: [
      ['👗', 'Saia Midi', 'R$109'],
      ['👕', 'Camiseta', 'R$79'],
      ['🧥', 'Jaqueta', 'R$189'],
    ],
    userBubble: 'Bermuda M pra homem',
    assistantBubble: 'Achei 2 opções! 🎉',
  },
  {
    storeName: 'Urban Mix',
    slug: 'urban-mix',
    cards: [
      ['✨', 'Conjunto', 'R$199'],
      ['🩳', 'Bermuda', 'R$99'],
      ['👕', 'Tie-Dye', 'R$69'],
    ],
    userBubble: 'Vestido festa tamanho P',
    assistantBubble: 'Encontrei 2 opções! 🎉',
  },
  {
    storeName: 'Urban Mix',
    slug: 'urban-mix',
    cards: [
      ['👖', 'Calça Slim', 'R$189'],
      ['🧥', 'Moletom', 'R$149'],
      ['👗', 'Vestido', 'R$189'],
    ],
    userBubble: 'Tem desconto no PIX?',
    assistantBubble: '5% no PIX sim! 💸',
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
                    vend.ai/{v.slug}
                  </span>
                </div>
              </div>
              {/* Área “desktop” */}
              <div className="aspect-[16/10] p-2.5 sm:p-3 bg-bg flex flex-col gap-2 min-h-0">
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className="font-syne font-extrabold text-[11px] text-grad shrink-0">
                    vend<span className="text-accent" style={{ WebkitTextFillColor: 'var(--accent)' }}>.</span>ai
                  </span>
                  <span className="text-[10px] text-muted truncate" title={v.storeName}>
                    {v.storeName}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 flex-1 min-h-0">
                  {v.cards.map(([emoji, name, price]) => (
                    <div
                      key={name}
                      className="bg-surface border border-border rounded-lg p-1.5 flex flex-col items-center text-center min-w-0"
                    >
                      <div className="text-lg leading-none mb-0.5" aria-hidden>
                        {emoji}
                      </div>
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
              <div className="flex justify-between items-center mb-2.5 min-w-0 gap-2">
                <span className="font-syne font-extrabold text-xs text-grad shrink-0">
                  vend<span className="text-accent" style={{ WebkitTextFillColor: 'var(--accent)' }}>.</span>ai
                </span>
                <span className="text-[10px] text-muted truncate min-w-0" title={v.storeName}>
                  {v.storeName}
                </span>
              </div>
              <div className="flex gap-2 mb-2.5" key={`m-cards-${index}`}>
                {v.cards.slice(0, 2).map(([emoji, name, price]) => (
                  <div
                    key={name}
                    className="flex-1 min-w-0 bg-surface rounded-[10px] p-2 border border-border text-center"
                  >
                    <div className="text-2xl mb-1" aria-hidden>
                      {emoji}
                    </div>
                    <div className="text-[10px] text-foreground truncate">{name}</div>
                    <div className="text-accent text-[11px] font-bold">{price}</div>
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
