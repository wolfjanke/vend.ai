'use client'

import Link from 'next/link'

export default function StoreError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-4xl mb-4" aria-hidden>
        ⚠️
      </p>
      <h1 className="font-syne font-bold text-xl sm:text-2xl text-foreground mb-2">
        Não foi possível carregar esta loja
      </h1>
      <p className="text-sm text-muted max-w-md mb-6 break-words">
        Tente de novo em instantes. Se o problema continuar, verifique se o endereço está correto.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          type="button"
          onClick={() => reset()}
          className="min-h-[44px] px-5 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90"
        >
          Tentar novamente
        </button>
        <Link
          href="/"
          className="min-h-[44px] inline-flex items-center px-5 rounded-xl border border-border text-sm font-medium text-foreground hover:border-primary"
        >
          Ir ao início
        </Link>
      </div>
    </div>
  )
}
