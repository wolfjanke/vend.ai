'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { normalizeStockAlerts } from '@/lib/stock-alerts'
import type { StockAlertsConfig } from '@/types'
import { saveStockAlerts } from '@/app/admin/actions'

interface Props {
  initial:  StockAlertsConfig
  onSaved?: (config: StockAlertsConfig) => void
}

export default function StockAlertsSettingsForm({ initial, onSaved }: Props) {
  const normalized = normalizeStockAlerts(initial)
  const [enabled, setEnabled] = useState(normalized.enabled)
  const [thresholdStr, setThresholdStr] = useState(String(normalized.threshold))
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function handleSave() {
    const stockAlerts = normalizeStockAlerts({
      enabled,
      threshold: Math.min(99, Math.max(1, parseInt(thresholdStr.trim(), 10) || 3)),
    })

    setError('')
    setSaved(false)

    startTransition(async () => {
      try {
        const result = await saveStockAlerts(stockAlerts.enabled, stockAlerts.threshold)
        setSaved(true)
        onSaved?.(result)
        window.setTimeout(() => setSaved(false), 2000)
      } catch (e) {
        const msg = e instanceof Error ? e.message : ''
        if (
          msg.toLowerCase().includes('fetch failed') ||
          msg.toLowerCase().includes('connect') ||
          msg.toLowerCase().includes('timeout')
        ) {
          setError('Falha de conexão com o banco. Verifique a internet e tente de novo.')
        } else {
          setError(msg || 'Erro ao salvar alertas.')
        }
      }
    })
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted break-words">
        Avisos internos no painel — não afetam a vitrine. Também aparecem no{' '}
        <Link href="/admin/dashboard" className="text-primary font-semibold hover:underline">
          dashboard
        </Link>.
      </p>

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
            Destaca SKUs com poucas peças (ex.: Vestido Rosa — M) na lista de produtos.
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
        onClick={handleSave}
        disabled={pending}
        className={`w-full min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
          saved
            ? 'bg-accent text-bg'
            : 'bg-primary text-white hover:bg-primary/90'
        } disabled:opacity-60`}
      >
        {pending ? 'Salvando…' : saved ? '✓ Salvo!' : 'Salvar alertas'}
      </button>
    </div>
  )
}
