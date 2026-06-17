'use client'

import {
  BILLING_CYCLES,
  formatBillingCycleLabel,
  formatBillingCycleLabelShort,
  getBillingCycleDiscountLabel,
  type BillingCycle,
} from '@/lib/plans'

interface Props {
  value: BillingCycle
  onChange: (cycle: BillingCycle) => void
}

export default function BillingCycleToggle({ value, onChange }: Props) {
  const activeIndex = Math.max(0, BILLING_CYCLES.indexOf(value))

  return (
    <div className="mb-4 min-w-0">
      <div className="grid grid-cols-3 gap-1 mb-1.5 px-1 min-w-0" aria-hidden>
        <span />
        <span />
        <span className="flex justify-center min-w-0">
          <span
            className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full whitespace-nowrap truncate max-w-full ${
              value === 'annual' ? 'bg-white/20 text-white' : 'bg-accent/20 text-accent'
            }`}
          >
            Melhor valor
          </span>
        </span>
      </div>

      <div
        className="relative grid grid-cols-3 p-1 rounded-2xl bg-surface2 border border-border min-w-0"
        role="tablist"
        aria-label="Periodicidade de cobrança"
      >
        <div
          className="pointer-events-none absolute top-1 bottom-1 rounded-xl bg-primary shadow-[0_2px_8px_var(--primary-glow)] transition-transform duration-200 ease-out"
          style={{
            width: 'calc((100% - 0.5rem) / 3)',
            transform: `translateX(calc(${activeIndex} * 100%))`,
            left: '0.25rem',
          }}
          aria-hidden
        />

        {BILLING_CYCLES.map(cycle => {
          const active = value === cycle
          const discount = getBillingCycleDiscountLabel(cycle)

          return (
            <button
              key={cycle}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={
                cycle === 'annual'
                  ? `${formatBillingCycleLabel(cycle)} — Melhor valor`
                  : formatBillingCycleLabel(cycle)
              }
              onClick={() => onChange(cycle)}
              className={`relative z-10 min-h-[44px] px-1 py-2 rounded-xl text-sm font-semibold transition-colors flex flex-col items-center justify-center gap-0.5 min-w-0 ${
                active ? 'text-white' : 'text-muted hover:text-foreground'
              }`}
            >
              <span className="truncate w-full text-center">{formatBillingCycleLabelShort(cycle)}</span>
              {discount ? (
                <span className={`text-[10px] font-normal truncate w-full text-center ${active ? 'text-white/80' : 'text-muted'}`}>
                  {discount}
                </span>
              ) : (
                <span className="text-[10px] font-normal invisible" aria-hidden>
                  —
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
