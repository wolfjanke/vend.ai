'use client'

import { useState } from 'react'
import Link from 'next/link'
import { normalizeStockAlerts } from '@/lib/stock-alerts'
import type { StockAlertsConfig } from '@/types'
import { adminCard } from '@/lib/admin-ui'

interface Props {
  initial:     StockAlertsConfig
  storeName:   string
  whatsapp:    string
}

export default function StockAlertsSettings({ initial, storeName, whatsapp }: Props) {
  const normalized = normalizeStockAlerts(initial)
  const [enabled, setEnabled] = useState(normalized.enabled)
  const [thresholdStr, setThresholdStr] = useState(String(normalized.threshold))
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    const stockAlerts = normalizeStockAlerts({
      enabled,
      threshold: Math.min(99, Math.max(1, parseInt(thresholdStr.trim(), 10) || 3)),
    })

    setLoading(true)
    setError('')
    setSaved(false)

    try {
      const res = await fetch('/api/admin/store', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: storeName.trim(), whatsapp, stockAlerts }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error ?? 'Erro ao salvar.')
        return
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('Erro ao salvar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className={`${adminCard} mb-6 space-y-4`}>
      <div>
        <h2 className="font-syne font-bold text-base sm:text-lg text-foreground">Alertas de estoque</h2>
        <p className="text-xs text-muted mt-1 break-words">
          Avisos internos no painel — não afetam a vitrine. Também aparecem no{' '}
          <Link href="/admin/dashboard" className="text-primary font-semibold hover:underline">
            dashboard
          </Link>.
        </p>
      </div>

      <label className="flex items-start gap-3 cursor-pointer min-h-[44px]">
        <input
          type="checkbox"
          checked={enabled}
          onChange={e => setEnabled(e.target.checked)}
          className="mt-1 shrink-0"
        />
        <span className="min-w-0">
          <span className="text-sm font-medium text-foreground block">Avisar estoque baixo no painel</span>
          <span className="text-xs text-muted break-words">
            Destaca SKUs com poucas peças (ex.: Vestido Rosa — M) na lista abaixo.
          </span>
        </span>
      </label>

      {enabled && (
        <div className="min-w-0">
          <label htmlFor="stock-threshold-produtos" className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">
            Avisar quando restar ≤
          </label>
          <input
            id="stock-threshold-produtos"
            type="number"
            min={1}
            max={99}
            inputMode="numeric"
            className="w-full max-w-[120px] min-h-[44px] px-4 py-3 bg-surface2 border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary"
            value={thresholdStr}
            onChange={e => setThresholdStr(e.target.value)}
          />
          <p className="text-xs text-muted mt-1.5 break-words">Peças por tamanho, cor ou volume (1 a 99).</p>
        </div>
      )}

      {error && (
        <p className="text-xs text-warm break-words" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={loading}
        className={`w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
          saved
            ? 'bg-accent text-bg'
            : 'bg-primary text-white hover:bg-primary/90'
        } disabled:opacity-60`}
      >
        {loading ? 'Salvando…' : saved ? '✓ Salvo!' : 'Salvar alertas'}
      </button>
    </section>
  )
}
