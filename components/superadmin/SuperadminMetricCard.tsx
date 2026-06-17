import type { ReactNode } from 'react'
import { superadminCard } from '@/lib/superadmin-ui'

interface Props {
  icon:      ReactNode
  value:     string | number
  label:     string
  sublabel?: string
  href?:     string
}

export default function SuperadminMetricCard({ icon, value, label, sublabel, href }: Props) {
  const inner = (
    <>
      <div className="text-muted mb-2">{icon}</div>
      <div className="font-syne font-extrabold text-xl sm:text-2xl mb-0.5 tabular-nums break-words">{value}</div>
      <div className="text-xs text-muted break-words">{label}</div>
      {sublabel && <div className="text-[10px] text-muted/80 mt-1 break-words">{sublabel}</div>}
    </>
  )

  const className = `${superadminCard} hover:border-warm/40 transition-all min-w-0 block no-underline text-inherit`

  if (href) {
    return (
      <a href={href} className={className}>
        {inner}
      </a>
    )
  }

  return <div className={className}>{inner}</div>
}
