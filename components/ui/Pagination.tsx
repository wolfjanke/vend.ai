import Link from 'next/link'

interface Props {
  page:       number
  totalPages: number
  basePath:   string
  /** query string sem ? inicial, ex: status=NOVO&search=foo */
  query?: string
}

function buildHref(basePath: string, query: string | undefined, p: number) {
  const sp = new URLSearchParams(query ?? '')
  if (p <= 1) sp.delete('page')
  else sp.set('page', String(p))
  const s = sp.toString()
  return s ? `${basePath}?${s}` : basePath
}

export default function Pagination({ page, totalPages, basePath, query }: Props) {
  if (totalPages <= 1) return null

  const href = (p: number) => buildHref(basePath, query, p)

  return (
    <nav className="flex flex-wrap items-center justify-center gap-2 mt-6" aria-label="Paginação">
      {page > 1 && (
        <Link
          href={href(page - 1)}
          className="min-h-[44px] min-w-[44px] px-3 flex items-center justify-center rounded-xl border border-border text-sm text-muted hover:text-foreground hover:border-primary transition-colors"
        >
          ← Anterior
        </Link>
      )}
      <span className="text-sm text-muted px-2">
        Página {page} de {totalPages}
      </span>
      {page < totalPages && (
        <Link
          href={href(page + 1)}
          className="min-h-[44px] min-w-[44px] px-3 flex items-center justify-center rounded-xl border border-border text-sm text-muted hover:text-foreground hover:border-primary transition-colors"
        >
          Próxima →
        </Link>
      )}
    </nav>
  )
}
