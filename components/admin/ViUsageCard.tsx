import Link from 'next/link'

type Props = {
  used:    number
  limit:   number
  percent: number
}

function barColor(percent: number) {
  if (percent >= 80) return 'bg-warm'
  if (percent >= 60) return 'bg-yellow-400'
  return 'bg-accent'
}

export default function ViUsageCard({ used, limit, percent }: Props) {
  const pct = Math.min(100, percent)

  return (
    <div id="vi" className="bg-surface border border-border rounded-2xl p-4 sm:p-5 min-w-0 scroll-mt-24">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Vi este mês</p>
          <p className="font-syne font-bold text-lg mt-1 tabular-nums break-words">
            {used.toLocaleString('pt-BR')} / {limit.toLocaleString('pt-BR')} msgs
          </p>
        </div>
        <span className="text-sm font-semibold text-muted tabular-nums shrink-0">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-surface2 overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all ${barColor(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <Link
        href="/admin/configuracoes"
        className="text-xs text-primary hover:underline min-h-[44px] inline-flex items-center"
      >
        Ver detalhes
      </Link>
    </div>
  )
}
