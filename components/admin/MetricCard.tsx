import type { ReactNode } from 'react'

interface Props {
  icon:        ReactNode
  value:       string | number
  label:       string
  valueColor?: string
  highlight?:  boolean
  sublabel?:   string
}

export default function MetricCard({
  icon,
  value,
  label,
  valueColor = 'text-foreground',
  highlight,
  sublabel,
}: Props) {
  return (
    <div
      className={`bg-surface border rounded-2xl p-4 hover:border-primary/50 hover:-translate-y-0.5 transition-all ${
        highlight ? 'border-accent/30' : 'border-border'
      }`}
    >
      <div className="text-muted mb-2 flex items-center justify-between gap-2">
        <span className="inline-flex" aria-hidden>
          {icon}
        </span>
      </div>
      <div className={`font-syne font-extrabold text-2xl sm:text-3xl mb-0.5 tabular-nums ${valueColor}`}>{value}</div>
      <div className="text-xs text-muted">{label}</div>
      {sublabel && <div className="text-[10px] text-muted/80 mt-1">{sublabel}</div>}
    </div>
  )
}
