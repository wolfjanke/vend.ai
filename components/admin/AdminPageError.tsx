interface Props {
  title:    string
  children: React.ReactNode
}

/** Mensagem inline quando uma page admin não consegue carregar dados (migration, DB, etc.). */
export default function AdminPageError({ title, children }: Props) {
  return (
    <div className="animate-fade-up max-w-lg min-w-0">
      <h1 className="font-syne font-extrabold text-xl sm:text-2xl mb-2">{title}</h1>
      <div className="rounded-2xl border border-warm/30 bg-warm/10 px-4 py-3 text-sm text-warm break-words">
        {children}
      </div>
    </div>
  )
}
