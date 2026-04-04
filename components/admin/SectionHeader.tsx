interface Props {
  title: string
  description?: string
  className?: string
}

export default function SectionHeader({ title, description, className = '' }: Props) {
  return (
    <div className={`pt-6 first:pt-0 border-t border-border first:border-0 ${className}`}>
      <h3 className="font-syne font-bold text-sm text-foreground mb-1">{title}</h3>
      {description && <p className="text-xs text-muted mb-4 break-words">{description}</p>}
    </div>
  )
}
