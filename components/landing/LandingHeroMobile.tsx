'use client'

/** Prévia compacta da vitrine no hero — visível só abaixo de `lg`. */
export default function LandingHeroMobile() {
  return (
    <div
      className="flex lg:hidden justify-center w-full min-w-0 mt-6 animate-fade-up"
      style={{ animationDelay: '0.12s' }}
      aria-hidden
    >
      <div className="w-full max-w-[280px] bg-surface border border-border rounded-[28px] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
        <div className="bg-surface2 rounded-[20px] p-3 overflow-hidden">
          <div className="flex justify-between items-center gap-2 mb-3 min-w-0">
            <span className="font-syne font-extrabold text-xs text-grad shrink-0">
              vend<span className="text-accent" style={{ WebkitTextFillColor: 'var(--accent)' }}>.</span>ai
            </span>
            <span className="text-[10px] text-muted truncate">Urban Mix</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              ['👗', 'Saia', 'R$109'],
              ['👕', 'Camiseta', 'R$79'],
            ].map(([emoji, name, price]) => (
              <div key={name} className="bg-surface rounded-[10px] p-2 border border-border text-center min-w-0">
                <div className="text-xl mb-0.5">{emoji}</div>
                <div className="text-[10px] text-foreground truncate">{name}</div>
                <div className="text-accent text-[11px] font-bold tabular-nums">{price}</div>
              </div>
            ))}
          </div>
          <div className="bg-bg rounded-[10px] p-2 flex flex-col gap-1.5 mb-2">
            <div className="bg-surface2 text-[10px] px-2 py-1 rounded-lg self-start max-w-[85%] break-words">
              Olá! Posso te ajudar? ✦
            </div>
            <div className="bg-primary/20 border border-primary/30 text-[10px] px-2 py-1 rounded-lg self-end max-w-[85%] break-words">
              Tem desconto no PIX?
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
