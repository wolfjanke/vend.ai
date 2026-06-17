'use client'

import { useEffect, useState } from 'react'
import SuperadminPageHeader from '@/components/superadmin/SuperadminPageHeader'
import { PLANS, PLAN_SLUGS } from '@/lib/plans'
import { BRAND } from '@/lib/brand'

type Config = {
  plan_limits: Record<string, { products: number | null; vi_messages: number }>
  take_rates: Record<string, number>
  maintenance_mode: boolean
  new_signups_enabled: boolean
  support_email: string
}

export default function ConfiguracoesClient() {
  const [config, setConfig] = useState<Config | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch('/api/superadmin/config')
      .then(r => r.json())
      .then(d => {
        setConfig({
          plan_limits: d.plan_limits ?? {},
          take_rates: d.take_rates ?? {},
          maintenance_mode: Boolean(d.maintenance_mode),
          new_signups_enabled: d.new_signups_enabled !== false,
          support_email: typeof d.support_email === 'string' ? d.support_email : BRAND.supportEmail,
        })
      })
  }, [])

  async function save() {
    if (!config) return
    setSaving(true)
    setMsg('')
    const res = await fetch('/api/superadmin/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    setSaving(false)
    setMsg(res.ok ? 'Salvo.' : 'Erro ao salvar.')
  }

  if (!config) return <p className="text-muted text-sm">Carregando…</p>

  return (
    <div className="min-w-0 animate-fade-up">
      <SuperadminPageHeader title="Configurações" description="Limites globais e flags do produto" />

      {msg && <p className="mb-4 text-sm">{msg}</p>}

      <section className="bg-surface border border-border rounded-2xl p-4 mb-4">
        <h2 className="font-syne font-bold text-sm mb-3">Limites por plano</h2>
        <div className="space-y-4">
          {PLAN_SLUGS.map(slug => {
            const lim = config.plan_limits[slug] ?? {
              products: PLANS[slug].productLimit,
              vi_messages: PLANS[slug].viMessagesLimit,
            }
            return (
              <div key={slug} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end border border-border/60 rounded-xl p-3">
                <span className="font-medium capitalize sm:col-span-1">{slug}</span>
                <label className="text-xs text-muted">
                  Produtos
                  <input
                    type="number"
                    className="w-full mt-1 min-h-[44px] px-3 rounded-lg bg-surface2 border border-border"
                    value={lim.products ?? ''}
                    placeholder="∞"
                    onChange={e => {
                      const v = e.target.value === '' ? null : Number(e.target.value)
                      setConfig(c => ({
                        ...c!,
                        plan_limits: {
                          ...c!.plan_limits,
                          [slug]: { ...lim, products: v },
                        },
                      }))
                    }}
                  />
                </label>
                <label className="text-xs text-muted">
                  Msgs Vi
                  <input
                    type="number"
                    className="w-full mt-1 min-h-[44px] px-3 rounded-lg bg-surface2 border border-border"
                    value={lim.vi_messages}
                    onChange={e => {
                      setConfig(c => ({
                        ...c!,
                        plan_limits: {
                          ...c!.plan_limits,
                          [slug]: { ...lim, vi_messages: Number(e.target.value) },
                        },
                      }))
                    }}
                  />
                </label>
              </div>
            )
          })}
        </div>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-4 mb-4">
        <h2 className="font-syne font-bold text-sm mb-3">Take rate (%)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PLAN_SLUGS.map(slug => (
            <label key={slug} className="text-xs text-muted capitalize">
              {slug}
              <input
                type="number"
                step="0.01"
                className="w-full mt-1 min-h-[44px] px-3 rounded-lg bg-surface2 border border-border"
                value={config.take_rates[slug] ?? 0}
                onChange={e => {
                  setConfig(c => ({
                    ...c!,
                    take_rates: { ...c!.take_rates, [slug]: Number(e.target.value) },
                  }))
                }}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-4 mb-4 space-y-3">
        <h2 className="font-syne font-bold text-sm">Globais</h2>
        <label className="flex items-center gap-2 min-h-[44px]">
          <input
            type="checkbox"
            checked={config.maintenance_mode}
            onChange={e => setConfig(c => ({ ...c!, maintenance_mode: e.target.checked }))}
          />
          <span className="text-sm">Modo manutenção</span>
        </label>
        <label className="flex items-center gap-2 min-h-[44px]">
          <input
            type="checkbox"
            checked={config.new_signups_enabled}
            onChange={e => setConfig(c => ({ ...c!, new_signups_enabled: e.target.checked }))}
          />
          <span className="text-sm">Novos cadastros habilitados</span>
        </label>
        <label className="block text-xs text-muted">
          E-mail de suporte
          <input
            type="email"
            className="w-full mt-1 min-h-[44px] px-3 rounded-lg bg-surface2 border border-border"
            value={config.support_email}
            onChange={e => setConfig(c => ({ ...c!, support_email: e.target.value }))}
          />
        </label>
      </section>

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="w-full sm:w-auto min-h-[44px] px-6 rounded-xl bg-[#FF6B6B] text-white font-medium disabled:opacity-60"
      >
        {saving ? 'Salvando…' : 'Salvar configurações'}
      </button>
    </div>
  )
}
