'use client'

import { AlertTriangle } from 'lucide-react'

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center px-4 py-12 text-center max-w-lg mx-auto">
      <AlertTriangle size={40} className="text-warm mb-4" aria-hidden />
      <h1 className="font-syne font-bold text-xl sm:text-2xl text-foreground mb-2">
        Erro ao carregar esta página
      </h1>
      <p className="text-sm text-muted mb-6 break-words">
        Pode ser instabilidade momentânea na conexão com o Neon, migration pendente ou internet.
        Confira <code className="font-mono text-xs">DATABASE_URL</code> (use endpoint com <code className="font-mono text-xs">-pooler</code>) e tente novamente.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="min-h-[44px] px-5 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90"
      >
        Tentar novamente
      </button>
    </div>
  )
}
