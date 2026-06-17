import type { ReactNode } from 'react'

interface Props {
  icon:        ReactNode
  value:       string | number
  label:       string
  valueColor?: string
  highlight?:  boolean
  sublabel?:   string
  className?:  string
}

export default function MetricCard({
  icon,
  value,
  label,
  valueColor = 'text-foreground',
  highlight,
  sublabel,
  className = '',
}: Props) {
  return (
    <div
      className={`bg-surface border rounded-2xl p-3.5 min-[360px]:p-4 sm:p-5 min-w-0 overflow-hidden hover:border-primary/50 hover:-translate-y-0.5 transition-all h-full flex flex-col ${
        highlight ? 'border-accent/30' : 'border-border'
      } ${className}`}
    >
      <div className="text-muted mb-1.5 sm:mb-2 flex items-center justify-between gap-2">
        <span className="inline-flex shrink-0" aria-hidden>
          {icon}
        </span>
      </div>
      <div
        className={`font-syne font-extrabold text-base min-[360px]:text-lg sm:text-2xl md:text-3xl mb-0.5 tabular-nums truncate ${valueColor}`}
        title={typeof value === 'string' ? value : String(value)}
      >
        {value}
      </div>
      <div className="text-[11px] min-[360px]:text-xs text-muted break-words leading-snug mt-auto">{label}</div>
      {sublabel && <div className="text-[10px] text-muted/80 mt-1 break-words">{sublabel}</div>}
    </div>
  )
}
