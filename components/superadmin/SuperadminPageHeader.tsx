interface Props {
  title:       string
  description?: string
}

export default function SuperadminPageHeader({ title, description }: Props) {
  return (
    <header className="mb-4 sm:mb-6 min-w-0">
      <h1 className="font-syne font-bold text-xl sm:text-2xl md:text-3xl break-words">{title}</h1>
      {description && (
        <p className="text-sm text-muted mt-1 break-words">{description}</p>
      )}
    </header>
  )
}
