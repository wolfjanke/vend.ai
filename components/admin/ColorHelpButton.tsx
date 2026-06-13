'use client'

import { useId, useState } from 'react'

type Props = {
  title: string
  items: string[]
}

export default function ColorHelpButton({ title, items }: Props) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Ajuda: ${title}`}
        className="min-w-[28px] min-h-[28px] w-7 h-7 rounded-full border border-border bg-surface2 text-muted text-xs font-bold hover:border-primary/50 hover:text-foreground transition-colors"
      >
        ?
      </button>
      {open && (
        <div
          id={panelId}
          role="tooltip"
          className="absolute left-0 top-full mt-1.5 z-20 w-[min(260px,calc(100vw-48px))] rounded-xl border border-border bg-surface p-3 shadow-lg text-[11px] text-muted space-y-1.5"
        >
          <p className="font-semibold text-foreground text-xs">Aparece em:</p>
          <ul className="list-disc pl-4 space-y-0.5 break-words">
            {items.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
