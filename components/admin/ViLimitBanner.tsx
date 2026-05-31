import Link from 'next/link'

export default function ViLimitBanner({ percent }: { percent: number }) {
  if (percent < 80) return null

  return (
    <div className="mb-6 rounded-xl border border-warm/40 bg-warm/10 px-4 py-3 text-sm text-foreground min-w-0">
      <p className="break-words">
        ⚠️ Você usou <strong>{percent}%</strong> das mensagens da Vi este mês.{' '}
        <Link href="/admin/configuracoes" className="text-primary underline">
          Ver uso detalhado
        </Link>
        {' · '}
        <Link href="/admin/pagamentos" className="text-primary underline">
          Fazer upgrade
        </Link>
      </p>
    </div>
  )
}
