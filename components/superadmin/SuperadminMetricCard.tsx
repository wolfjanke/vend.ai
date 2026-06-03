import type { ReactNode } from 'react'

interface Props {
  icon:        ReactNode
  value:       string | number
  label:       string
  sublabel?:   string
}

export default function SuperadminMetricCard({ icon, value, label, sublabel }: Props) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 hover:border-[#FF6B6B]/40 transition-all min-w-0">
      <div className="text-muted mb-2">{icon}</div>
      <div className="font-syne font-extrabold text-xl sm:text-2xl mb-0.5 tabular-nums break-words">{value}</div>
      <div className="text-xs text-muted break-words">{label}</div>
      {sublabel && <div className="text-[10px] text-muted/80 mt-1 break-words">{sublabel}</div>}
    </div>
  )
}
