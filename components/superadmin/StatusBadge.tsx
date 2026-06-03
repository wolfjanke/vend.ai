import type { SubscriptionStatus } from '@/types'

const STYLES: Record<string, string> = {
  ACTIVE:    'bg-green-500/15 text-green-400 border-green-500/30',
  TRIAL:     'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  OVERDUE:   'bg-red-500/15 text-red-400 border-red-500/30',
  CANCELLED: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
}

const LABELS: Record<string, string> = {
  ACTIVE:    'Ativo',
  TRIAL:     'Trial',
  OVERDUE:   'Inadimplente',
  CANCELLED: 'Cancelado',
}

export default function StatusBadge({ status }: { status?: SubscriptionStatus | string | null }) {
  const key = status ?? '—'
  const style = STYLES[key] ?? 'bg-surface2 text-muted border-border'
  const label = LABELS[key] ?? (status || '—')

  return (
    <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium border ${style}`}>
      {label}
    </span>
  )
}
