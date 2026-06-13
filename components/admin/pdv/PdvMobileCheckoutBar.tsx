'use client'

import { formatPdvCurrency } from './pdv-utils'

interface Props {
  total:      number
  hasItems:   boolean
  onFinalize: () => void
}

export default function PdvMobileCheckoutBar({ total, hasItems, onFinalize }: Props) {
  if (!hasItems) return null

  return (
    <div
      className="xl:hidden fixed left-0 right-0 z-40 max-w-[100vw] border-t border-border bg-surface/95 backdrop-blur-md px-4 py-3 flex items-center gap-3"
      style={{ bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-muted uppercase tracking-wider">Total</div>
        <div className="font-syne font-extrabold text-lg text-accent tabular-nums truncate">
          {formatPdvCurrency(total)}
        </div>
      </div>
      <button
        type="button"
        onClick={onFinalize}
        className="shrink-0 min-h-[44px] px-5 py-2.5 bg-primary text-white font-syne font-bold text-sm rounded-xl hover:shadow-[0_4px_20px_var(--primary-glow)] transition-all"
      >
        Finalizar
      </button>
    </div>
  )
}
