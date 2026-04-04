'use client'

import { useEffect } from 'react'

interface Props {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-bg/80"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="bg-surface border border-border rounded-2xl p-5 w-full max-w-md shadow-xl max-h-[calc(100vh-32px)] overflow-y-auto">
        <h3 id="confirm-dialog-title" className="font-syne font-bold text-base text-foreground mb-2">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-muted leading-relaxed mb-5 break-words">{description}</p>
        )}
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] px-4 rounded-xl border border-border text-sm text-muted hover:text-foreground transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`min-h-[44px] px-4 rounded-xl text-sm font-bold transition-colors ${
              variant === 'destructive'
                ? 'bg-red-500/90 text-white hover:bg-red-500'
                : 'bg-primary text-white hover:opacity-90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
