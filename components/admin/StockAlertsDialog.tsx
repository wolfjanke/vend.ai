'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Bell, X } from 'lucide-react'
import { normalizeStockAlerts } from '@/lib/stock-alerts'
import type { StockAlertsConfig } from '@/types'
import StockAlertsSettingsForm from '@/components/admin/StockAlertsSettingsForm'

interface Props {
  initial: StockAlertsConfig
}

export default function StockAlertsDialog({ initial }: Props) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [alerts, setAlerts] = useState(() => normalizeStockAlerts(initial))

  useEffect(() => {
    setAlerts(normalizeStockAlerts(initial))
  }, [initial])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  function handleSaved(config: StockAlertsConfig) {
    setAlerts(config)
    window.setTimeout(() => setOpen(false), 900)
  }

  const dialog =
    open && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[700] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-bg/80 backdrop-blur-[2px] overscroll-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby="stock-alerts-dialog-title"
            onClick={() => setOpen(false)}
          >
            <div
              className="bg-surface border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-w-[calc(100vw-0px)] shadow-xl max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-bottom,0px)))] sm:max-h-[calc(100dvh-32px)] overflow-y-auto overscroll-contain p-5 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))]"
              onClick={e => e.stopPropagation()}
            >
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border sm:hidden" aria-hidden />

              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <h2
                    id="stock-alerts-dialog-title"
                    className="font-syne font-bold text-base sm:text-lg text-foreground"
                  >
                    Alertas de estoque
                  </h2>
                  {alerts.enabled && (
                    <p className="text-[11px] text-yellow-400 mt-0.5 break-words">
                      Ativo — avisa quando restar ≤ {alerts.threshold}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="shrink-0 w-10 h-10 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-border text-muted hover:text-foreground"
                  aria-label="Fechar"
                >
                  <X size={18} />
                </button>
              </div>

              <StockAlertsSettingsForm
                key={`${open}-${alerts.enabled}-${alerts.threshold}`}
                initial={alerts}
                onSaved={handleSaved}
              />
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`relative flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 min-h-[44px] rounded-xl border text-sm font-semibold transition-all touch-manipulation ${
          alerts.enabled
            ? 'border-yellow-400/40 bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/15'
            : 'border-border bg-surface2 text-muted hover:text-foreground hover:border-primary/40'
        }`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="stock-alerts-dialog-title"
      >
        <Bell size={18} aria-hidden className="shrink-0" />
        <span className="truncate">Alertas</span>
        {alerts.enabled && (
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-yellow-400"
            aria-hidden
          />
        )}
      </button>
      {dialog}
    </>
  )
}
