'use client'

import { useState } from 'react'
import { Info, Megaphone, Ticket } from 'lucide-react'
import type { Store, BannerMessage, CouponRule } from '@/types'
import { getStoreProfile } from '@/types'
import { storeSettingsPatchSchema } from '@/lib/validations'
import SectionHeader from '@/components/admin/SectionHeader'

interface Props {
  store: Store
}

function couponPreview(c: CouponRule): string | null {
  const code = c.code.trim()
  if (!code || c.value == null) return null
  if (c.type === 'percent') return `${code} → ${c.value}% off`
  return `${code} → R$ ${Number(c.value).toFixed(2).replace('.', ',')} off`
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
    setBannerMessages(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: '',
        text: '',
        startDate: '',
        endDate: '',
      },
    ])
  }

  function removeBanner(id: string) {
    setBannerMessages(prev => prev.filter(m => m.id !== id))
  }

  function updateBanner(id: string, field: keyof BannerMessage, value: string) {
    setBannerMessages(prev => prev.map(m => (m.id === id ? { ...m, [field]: value } : m)))
  }

  function addCoupon() {
    setCouponRules(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        code: '',
        type: 'percent',
        value: 0,
        active: true,
        startDate: '',
        endDate: '',
        minOrderValue: undefined,
        maxDiscountValue: undefined,
      },
    ])
  }

  function removeCoupon(id: string) {
    setCouponRules(prev => prev.filter(c => c.id !== id))
  }

  function updateCoupon(id: string, patch: Partial<CouponRule>) {
    setCouponRules(prev => prev.map(c => (c.id === id ? { ...c, ...patch } : c)))
  }

  async function handleSave() {
    const profile = getStoreProfile(settings)
    const body = {
      name: store.name,
      whatsapp: store.whatsapp,
      logo_url: store.logo_url,
      freteInfo: settings.freteInfo ?? '',
      pagamentoInfo: settings.pagamentoInfo ?? '',
      genderFocus: profile.genderFocus,
      ageGroup: profile.ageGroup,
      cep: store.cep ?? '',
      logradouro: store.logradouro ?? '',
      numero: store.numero ?? '',
      complemento: store.complemento ?? '',
      bairro: store.bairro ?? '',
      cidade: store.cidade ?? '',
      uf: store.uf ?? '',
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
    <div className="bg-surface border border-border rounded-2xl p-4 sm:p-6 flex flex-col gap-2">
      <SectionHeader
        title="Desconto PIX"
        description="Percentual automático quando o cliente escolhe PIX no checkout."
      />
      <div className="flex items-start gap-2 mb-2">
        <label className="text-xs font-bold text-muted uppercase tracking-wider flex-1">Desconto PIX (%)</label>
        <span
          className="text-muted shrink-0"
          title="O desconto é aplicado automaticamente no checkout quando o cliente escolhe PIX. Ex: 5 = 5% de desconto."
        >
          <Info size={16} aria-hidden />
        </span>
      </div>
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
      <p className="text-xs text-muted mt-1.5 mb-6">
        Aplicado automaticamente no checkout quando o cliente selecionar PIX.
      </p>

      <SectionHeader
        title="Cupons de desconto"
        description="Cada loja possui seus próprios cupons. Você pode ativar ou desativar por período."
      />
      <div className="flex items-center justify-between mb-3">
        <span className="sr-only">Adicionar cupom</span>
        <button
          type="button"
          onClick={addCoupon}
          className="text-xs text-primary font-semibold hover:underline min-h-[44px] px-2 ml-auto"
        >
          + Adicionar cupom
        </button>
      </div>

      {couponRules.length === 0 ? (
        <div className="text-center py-10 px-4 border border-dashed border-border rounded-xl mb-6">
          <Ticket className="w-10 h-10 mx-auto mb-3 text-muted opacity-60" aria-hidden />
          <p className="text-sm font-medium text-foreground mb-1">Nenhum cupom criado</p>
          <p className="text-xs text-muted">Crie o primeiro para oferecer desconto aos seus clientes.</p>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {couponRules.map(c => {
            const prev = couponPreview(c)
            return (
              <div key={c.id} className="p-3 bg-surface2 border border-border rounded-xl">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                  {prev ? (
                    <span className="text-[11px] font-mono px-2 py-1 rounded-lg bg-primary/15 text-primary border border-primary/30 break-all">
                      {prev}
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted">Preencha código e valor</span>
                  )}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={c.active}
                    onClick={() => updateCoupon(c.id, { active: !c.active })}
                    className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
                      c.active ? 'bg-primary' : 'bg-muted/40'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        c.active ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
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
                  <div className="sm:col-span-2 max-w-xs">
                    <label className="text-[10px] text-muted block mb-1">Valor</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className="w-full min-h-[44px] px-3 py-2 bg-surface border border-border rounded-lg text-xs"
                      value={c.value}
                      onChange={e => updateCoupon(c.id, { value: Number(e.target.value || 0) })}
                      placeholder={c.type === 'percent' ? 'Valor em %' : 'Valor em R$'}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="text-[10px] text-muted block mb-1">Válido de</label>
                    <input
                      type="date"
                      className="w-full min-h-[44px] px-3 py-2 bg-surface border border-border rounded-lg text-xs"
                      value={c.startDate ?? ''}
                      onChange={e => updateCoupon(c.id, { startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted block mb-1">Até</label>
                    <input
                      type="date"
                      className="w-full min-h-[44px] px-3 py-2 bg-surface border border-border rounded-lg text-xs"
                      value={c.endDate ?? ''}
                      onChange={e => updateCoupon(c.id, { endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="w-full min-h-[44px] px-3 py-2 bg-surface border border-border rounded-lg text-xs"
                    value={c.minOrderValue ?? ''}
                    onChange={e =>
                      updateCoupon(c.id, { minOrderValue: e.target.value ? Number(e.target.value) : undefined })
                    }
                    placeholder="Pedido mínimo (R$)"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className="w-full min-h-[44px] px-3 py-2 bg-surface border border-border rounded-lg text-xs"
                      value={c.maxDiscountValue ?? ''}
                      onChange={e =>
                        updateCoupon(c.id, {
                          maxDiscountValue: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
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
            )
          })}
        </div>
      )}

      <SectionHeader
        title="Banners da vitrine"
        description="Aparecem na loja em faixa rotativa. Opcional: datas para épocas (Páscoa, Natal)."
      />
      <div className="flex justify-end mb-3">
        <button type="button" onClick={addBanner} className="text-xs text-primary font-semibold hover:underline min-h-[44px] px-2">
          + Adicionar mensagem
        </button>
      </div>

      {bannerMessages.length === 0 ? (
        <div className="text-center py-10 px-4 border border-dashed border-border rounded-xl mb-4">
          <Megaphone className="w-10 h-10 mx-auto mb-3 text-muted opacity-60" aria-hidden />
          <p className="text-sm font-medium text-foreground mb-1">Nenhuma mensagem no banner</p>
          <p className="text-xs text-muted">Adicione avisos de frete, promoções ou datas comemorativas.</p>
        </div>
      ) : (
        bannerMessages.map(m => (
          <div key={m.id} className="mb-3 p-3 bg-surface2 border border-border rounded-xl">
            <div className="flex gap-2 mb-2">
              <input
                className="flex-1 min-w-0 min-h-[44px] px-3 py-2 bg-surface border border-border rounded-lg text-foreground text-xs outline-none focus:border-primary"
                placeholder="Título (ex: Páscoa)"
                value={m.title}
                onChange={e => updateBanner(m.id, 'title', e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeBanner(m.id)}
                className="px-2 py-1 min-h-[44px] text-warm text-xs border border-warm/30 rounded-lg hover:bg-warm/10 shrink-0"
              >
                Remover
              </button>
            </div>
            <textarea
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground text-xs outline-none focus:border-primary min-h-[60px] resize-y mb-2 placeholder:text-muted"
              placeholder="Texto da mensagem"
              value={m.text}
              onChange={e => updateBanner(m.id, 'text', e.target.value)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted block mb-1">Exibir de</label>
                <input
                  type="date"
                  className="w-full min-h-[44px] px-3 py-1.5 bg-surface border border-border rounded-lg text-foreground text-xs"
                  value={m.startDate ?? ''}
                  onChange={e => updateBanner(m.id, 'startDate', e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] text-muted block mb-1">Até</label>
                <input
                  type="date"
                  className="w-full min-h-[44px] px-3 py-1.5 bg-surface border border-border rounded-lg text-foreground text-xs"
                  value={m.endDate ?? ''}
                  onChange={e => updateBanner(m.id, 'endDate', e.target.value)}
                />
              </div>
            </div>
          </div>
        ))
      )}

      {error && <p className="text-sm text-warm">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={loading}
        className={`w-full min-h-[48px] py-3 rounded-[12px] font-syne font-bold text-sm transition-all mt-4 ${
          saved ? 'bg-accent text-bg' : 'bg-primary text-white hover:shadow-[0_4px_20px_var(--primary-glow)]'
        } disabled:opacity-60`}
      >
        {loading ? 'Salvando…' : saved ? '✓ Salvo!' : 'Salvar alterações'}
      </button>
    </div>
  )
}
