'use client'

import { useEffect, useState } from 'react'

const ROTATE_MS = 5500

const VARIANTS = [
  {
    storeName: 'Bella Moda',
    cards: [
      ['👗', 'Vestido Rosa', 'R$89'],
      ['✨', 'Conjunto', 'R$189'],
    ],
    userBubble: 'Vestido para festa P',
    assistantBubble: 'Encontrei 2 opções! 🎉',
  },
  {
    storeName: 'Urban Fit',
    cards: [
      ['👕', 'Camiseta Lisa', 'R$59'],
      ['🩳', 'Bermuda Jeans', 'R$99'],
    ],
    userBubble: 'Camiseta básica M',
    assistantBubble: 'Separei 3 opções! 🎉',
  },
  {
    storeName: 'Pequeno Estilo',
    cards: [
      ['👶', 'Body RN', 'R$45'],
      ['🧸', 'Conjunto Kids', 'R$79'],
    ],
    userBubble: 'Body menino tam. 1',
    assistantBubble: 'Aqui estão as melhores! ✨',
  },
] as const

export default function LandingPhoneMockup() {
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
      className="hidden lg:block flex-shrink-0 animate-fade-up transition-opacity duration-500"
      style={{ animationDelay: '0.2s' }}
      aria-live="polite"
      aria-label="Prévia da loja no celular"
    >
      <div className="w-52 bg-surface border border-border rounded-[32px] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.5),0_0_0_1px_#7B6EFF22]">
        <div className="bg-surface2 rounded-[20px] p-3 overflow-hidden">
          <div className="flex justify-between items-center mb-2.5 min-w-0 gap-2">
            <span className="font-syne font-extrabold text-xs text-grad shrink-0">
              vend<span className="text-accent" style={{ WebkitTextFillColor: 'var(--accent)' }}>.</span>ai
            </span>
            <span className="text-[10px] text-muted truncate min-w-0" title={v.storeName}>{v.storeName}</span>
          </div>
          <div className="flex gap-2 mb-2.5" key={`cards-${index}`}>
            {v.cards.map(([emoji, name, price]) => (
              <div key={name} className="flex-1 min-w-0 bg-surface rounded-[10px] p-2 border border-border text-center">
                <div className="text-2xl mb-1" aria-hidden>{emoji}</div>
                <div className="text-[10px] text-foreground truncate">{name}</div>
                <div className="text-accent text-[11px] font-bold">{price}</div>
              </div>
            ))}
          </div>
          <div className="bg-bg rounded-[10px] p-2 flex flex-col gap-1.5 mb-2.5" key={`chat-${index}`}>
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
          <div className="bg-accent text-bg text-[10px] font-bold text-center py-1.5 rounded-lg font-syne">Finalizar pelo WhatsApp</div>
        </div>
      </div>
    </div>
  )
}
