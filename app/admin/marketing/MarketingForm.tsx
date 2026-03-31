'use client'

import { useState } from 'react'
import type { Store, BannerMessage, CouponRule } from '@/types'
import { storeSettingsPatchSchema } from '@/lib/validations'

interface Props {
  store: Store
}

export default function MarketingForm({ store }: Props) {
  const settings = store.settings_json ?? {}
  const [pixDiscountPercent, setPixDiscountPercent] = useState<number>(Number(settings.pixDiscountPercent ?? 0))
  const [couponRules, setCouponRules] = useState<CouponRule[]>(settings.couponRules ?? [])
  const [bannerMessages, setBannerMessages] = useState<BannerMessage[]>(settings.bannerMessages ?? [])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function addBanner() {
    setBannerMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      title: '',
      text: '',
      startDate: '',
      endDate: '',
    }])
  }

  function removeBanner(id: string) {
    setBannerMessages(prev => prev.filter(m => m.id !== id))
  }

  function updateBanner(id: string, field: keyof BannerMessage, value: string) {
    setBannerMessages(prev => prev.map(m => (m.id === id ? { ...m, [field]: value } : m)))
  }

  function addCoupon() {
    setCouponRules(prev => [...prev, {
      id: crypto.randomUUID(),
      code: '',
      type: 'percent',
      value: 0,
      active: true,
      startDate: '',
      endDate: '',
      minOrderValue: undefined,
      maxDiscountValue: undefined,
    }])
  }

  function removeCoupon(id: string) {
    setCouponRules(prev => prev.filter(c => c.id !== id))
  }

  function updateCoupon(id: string, patch: Partial<CouponRule>) {
    setCouponRules(prev => prev.map(c => (c.id === id ? { ...c, ...patch } : c)))
  }

  async function handleSave() {
    const body = {
      // obrigatórios do schema atual
      name: store.name,
      whatsapp: store.whatsapp,
      logo_url: store.logo_url,
      // manter dados já existentes para evitar limpeza acidental
      freteInfo: settings.freteInfo ?? '',
      pagamentoInfo: settings.pagamentoInfo ?? '',
      cep: store.cep ?? '',
      logradouro: store.logradouro ?? '',
      numero: store.numero ?? '',
      complemento: store.complemento ?? '',
      bairro: store.bairro ?? '',
      cidade: store.cidade ?? '',
      uf: store.uf ?? '',
      // campos da seção marketing
      pixDiscountPercent: Number.isFinite(pixDiscountPercent) ? Math.max(0, Math.min(100, pixDiscountPercent)) : 0,
      couponRules: couponRules
        .map(c => ({
          ...c,
          code: c.code.trim().toUpperCase(),
          value: Number(c.value || 0),
          minOrderValue: c.minOrderValue == null ? undefined : Number(c.minOrderValue),
          maxDiscountValue: c.maxDiscountValue == null ? undefined : Number(c.maxDiscountValue),
        }))
        .filter(c => c.code && c.value >= 0),
      bannerMessages: bannerMessages.filter(m => m.text.trim()),
    }

    const parsed = storeSettingsPatchSchema.safeParse(body)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Verifique os campos.')
      return
    }

    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/store', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    setLoading(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data?.error ?? 'Erro ao salvar.')
      return
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 sm:p-6 flex flex-col gap-4">
      <div>
        <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Desconto PIX (%)</label>
        <input
          type="number"
          min={0}
          max={100}
          step="0.01"
          className="w-full min-h-[44px] px-4 py-3 bg-surface2 border border-border rounded-[12px] text-foreground text-sm outline-none focus:border-primary transition-all"
          value={pixDiscountPercent}
          onChange={e => setPixDiscountPercent(Number(e.target.value || 0))}
          placeholder="Ex: 5"
        />
        <p className="text-xs text-muted mt-1.5">Aplicado automaticamente no checkout quando o cliente selecionar PIX.</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-muted uppercase tracking-wider">Cupons de desconto</label>
          <button type="button" onClick={addCoupon} className="text-xs text-primary font-semibold hover:underline min-h-[44px] px-2">
            + Adicionar
          </button>
        </div>
        <p className="text-xs text-muted mb-2">Cada loja possui seus próprios cupons. Você pode ativar/desativar por período.</p>
        <div className="space-y-3">
          {couponRules.map(c => (
            <div key={c.id} className="p-3 bg-surface2 border border-border rounded-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                <input
                  className="w-full min-h-[44px] px-3 py-2 bg-surface border border-border rounded-lg text-xs uppercase"
                  placeholder="Código (ex: WELCOME10)"
                  value={c.code}
                  onChange={e => updateCoupon(c.id, { code: e.target.value.toUpperCase() })}
                />
                <select
                  className="w-full min-h-[44px] px-3 py-2 bg-surface border border-border rounded-lg text-xs"
                  value={c.type}
                  onChange={e => updateCoupon(c.id, { type: e.target.value as CouponRule['type'] })}
                >
                  <option value="percent">Percentual (%)</option>
                  <option value="fixed">Valor fixo (R$)</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="w-full min-h-[44px] px-3 py-2 bg-surface border border-border rounded-lg text-xs"
                  value={c.value}
                  onChange={e => updateCoupon(c.id, { value: Number(e.target.value || 0) })}
                  placeholder={c.type === 'percent' ? 'Valor em %' : 'Valor em R$'}
                />
                <label className="inline-flex items-center gap-2 text-xs text-foreground min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={c.active}
                    onChange={e => updateCoupon(c.id, { active: e.target.checked })}
                  />
                  Cupom ativo
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                <input
                  type="date"
                  className="w-full min-h-[44px] px-3 py-2 bg-surface border border-border rounded-lg text-xs"
                  value={c.startDate ?? ''}
                  onChange={e => updateCoupon(c.id, { startDate: e.target.value })}
                />
                <input
                  type="date"
                  className="w-full min-h-[44px] px-3 py-2 bg-surface border border-border rounded-lg text-xs"
                  value={c.endDate ?? ''}
                  onChange={e => updateCoupon(c.id, { endDate: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="w-full min-h-[44px] px-3 py-2 bg-surface border border-border rounded-lg text-xs"
                  value={c.minOrderValue ?? ''}
                  onChange={e => updateCoupon(c.id, { minOrderValue: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="Pedido mínimo (R$)"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="w-full min-h-[44px] px-3 py-2 bg-surface border border-border rounded-lg text-xs"
                    value={c.maxDiscountValue ?? ''}
                    onChange={e => updateCoupon(c.id, { maxDiscountValue: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="Teto desconto (R$)"
                  />
                  <button
                    type="button"
                    onClick={() => removeCoupon(c.id)}
                    className="shrink-0 min-h-[44px] px-3 border border-warm/30 text-warm rounded-lg text-xs hover:bg-warm/10"
                  >
                    Remover
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-muted uppercase tracking-wider">Mensagens do banner</label>
          <button type="button" onClick={addBanner} className="text-xs text-primary font-semibold hover:underline min-h-[44px] px-2">
            + Adicionar
          </button>
        </div>
        <p className="text-xs text-muted mb-2">Aparecem na loja em faixa rotativa. Opcional: datas para exibir em épocas (ex: Páscoa, Natal).</p>
        {bannerMessages.map(m => (
          <div key={m.id} className="mb-3 p-3 bg-surface2 border border-border rounded-xl">
            <div className="flex gap-2 mb-2">
              <input
                className="flex-1 min-w-0 min-h-[44px] px-3 py-2 bg-surface border border-border rounded-lg text-foreground text-xs outline-none focus:border-primary"
                placeholder="Título (ex: Páscoa)"
                value={m.title}
                onChange={e => updateBanner(m.id, 'title', e.target.value)}
              />
              <button type="button" onClick={() => removeBanner(m.id)} className="px-2 py-1 min-h-[44px] text-warm text-xs border border-warm/30 rounded-lg hover:bg-warm/10 shrink-0">
                Remover
              </button>
            </div>
            <textarea
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground text-xs outline-none focus:border-primary min-h-[60px] resize-y mb-2 placeholder:text-muted"
              placeholder="Texto da mensagem"
              value={m.text}
              onChange={e => updateBanner(m.id, 'text', e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                className="min-h-[44px] px-3 py-1.5 bg-surface border border-border rounded-lg text-foreground text-xs"
                value={m.startDate ?? ''}
                onChange={e => updateBanner(m.id, 'startDate', e.target.value)}
              />
              <input
                type="date"
                className="min-h-[44px] px-3 py-1.5 bg-surface border border-border rounded-lg text-foreground text-xs"
                value={m.endDate ?? ''}
                onChange={e => updateBanner(m.id, 'endDate', e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-warm">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={loading}
        className={`w-full min-h-[48px] py-3 rounded-[12px] font-syne font-bold text-sm transition-all ${
          saved ? 'bg-accent text-bg' : 'bg-primary text-white hover:shadow-[0_4px_20px_var(--primary-glow)]'
        } disabled:opacity-60`}
      >
        {loading ? 'Salvando…' : saved ? '✓ Salvo!' : 'Salvar alterações'}
      </button>
    </div>
  )
}
