import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export default function ViLimitBanner({ percent }: { percent: number }) {
  if (percent < 80) return null

  return (
    <div className="mb-6 rounded-xl border border-warm/40 bg-warm/10 px-4 py-3 text-sm text-foreground min-w-0">
      <p className="break-words flex items-start gap-2">
        <AlertTriangle size={16} className="shrink-0 text-warm mt-0.5" aria-hidden />
        <span>
          Você usou <strong>{percent}%</strong> das mensagens do Assistente IA este mês.{' '}
          <Link href="/admin/loja?secao=vi" className="text-primary underline">
            Ver uso detalhado
          </Link>
          {' · '}
          <Link href="/admin/plano" className="text-primary underline">
            Fazer upgrade
          </Link>
        </span>
      </p>
    </div>
  )
}
