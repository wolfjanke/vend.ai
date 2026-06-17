'use client'

import { useState } from 'react'
import { Info, Megaphone, Sparkles, Ticket } from 'lucide-react'
import type { Store, BannerMessage, CouponRule } from '@/types'
import { getStoreProfile } from '@/types'
import { storeSettingsPatchSchema } from '@/lib/validations'
import { BANNER_TEXT_MAX_CHARS, normalizeBannerMotion, type BannerMotion } from '@/lib/banners'
import SectionHeader from '@/components/admin/SectionHeader'
import BannerStrip from '@/components/loja/BannerStrip'
import { adminCard } from '@/lib/admin-ui'
import { stripEmojis } from '@/lib/strip-emoji'

interface Props {
  store: Store
  checkoutLaunchEnabled?: boolean
}

function couponPreview(c: CouponRule): string | null {
  const code = c.code.trim()
  if (!code || c.value == null) return null
  if (c.type === 'percent') return `${code} → ${c.value}% off`
  return `${code} → R$ ${Number(c.value).toFixed(2).replace('.', ',')} off`
}

export default function MarketingForm({ store, checkoutLaunchEnabled = false }: Props) {
  const settings = store.settings_json ?? {}
  const [pixDiscountPercent, setPixDiscountPercent] = useState<number>(Number(settings.pixDiscountPercent ?? 0))
  const [couponRules, setCouponRules] = useState<CouponRule[]>(settings.couponRules ?? [])
  const [bannerMessages, setBannerMessages] = useState<BannerMessage[]>(
    (settings.bannerMessages ?? []).map(m => ({
      ...m,
      title:  m.title ?? '',
      motion: normalizeBannerMotion(m.motion),
    })),
  )
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [bannerSuggestions, setBannerSuggestions] = useState<Record<string, string[]>>({})

  function addBanner() {
    setBannerMessages(prev => [
      ...prev,
      {
        id:        crypto.randomUUID(),
        text:      '',
        startDate: '',
        endDate:   '',
        motion:    'pulse' as BannerMotion,
      },
    ])
  }

  function removeBanner(id: string) {
    setBannerMessages(prev => prev.filter(m => m.id !== id))
  }

  function updateBanner(
    id: string,
    patch: Partial<Pick<BannerMessage, 'text' | 'startDate' | 'endDate' | 'motion'>>,
  ) {
    setBannerMessages(prev =>
      prev.map(m => {
        if (m.id !== id) return m
        const next = { ...m, ...patch }
        if (patch.text != null) next.text = stripEmojis(patch.text)
        return next
      }),
    )
    if (patch.text != null) {
      setBannerSuggestions(prev => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    }
  }

  async function generateBannerText(bannerId: string) {
    const banner = bannerMessages.find(m => m.id === bannerId)
    if (!banner) return

    setGeneratingId(bannerId)
    setError('')

    try {
      const res = await fetch('/api/admin/marketing/banner-text', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hint:               banner.text || undefined,
          startDate:          banner.startDate,
          endDate:            banner.endDate,
          pixDiscountPercent,
          couponRules:        couponRules.filter(c => c.active && c.code.trim()),
          freteInfo:          settings.freteInfo,
          freeShippingMin:    settings.freeShippingMin ?? null,
        }),
      })
      const data = await res.json() as { suggestions?: string[]; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Erro ao gerar texto')

      const suggestions = data.suggestions ?? []
      if (!suggestions.length) throw new Error('Nenhuma sugestão retornada')

      updateBanner(bannerId, { text: suggestions[0] })
      setBannerSuggestions(prev => ({ ...prev, [bannerId]: suggestions }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao gerar texto')
    } finally {
      setGeneratingId(null)
    }
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
    const next = patch.code != null ? { ...patch, code: stripEmojis(patch.code).toUpperCase() } : patch
    setCouponRules(prev => prev.map(c => (c.id === id ? { ...c, ...next } : c)))
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
      bannerMessages: bannerMessages
        .filter(m => m.text.trim())
        .map(m => ({
          id:        m.id,
          text:      m.text.trim(),
          startDate: m.startDate,
          endDate:   m.endDate,
          motion:    normalizeBannerMotion(m.motion),
        })),
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
    <div className="space-y-6">
      <div className="p-4 rounded-xl border border-primary/25 bg-primary/5 text-sm text-foreground break-words">
        <p className="font-semibold mb-2">Onde cupons e desconto PIX valem</p>
        <ul className="space-y-1.5 text-xs sm:text-sm text-muted list-disc pl-4">
          <li>
            <strong className="text-foreground font-medium">Carrinho WhatsApp</strong> — cupom digitado no carrinho e desconto PIX ao escolher pagamento PIX.
          </li>
          <li>
            <strong className="text-foreground font-medium">Checkout no site</strong>
            {checkoutLaunchEnabled
              ? ' — mesmas regras quando o checkout integrado estiver ativo na loja (Configurações → Venda).'
              : ' — em breve, com as mesmas regras (checkout integrado ainda não liberado no ambiente).'}
          </li>
          <li>
            <strong className="text-foreground font-medium">Banners</strong> — apenas na vitrine (faixa rotativa no topo da loja).
          </li>
        </ul>
      </div>

      <div className={adminCard}>
      <SectionHeader
        title="Desconto PIX"
        description="Percentual automático quando o cliente escolhe PIX no carrinho ou no checkout integrado."
      />
      <div className="flex items-start gap-2 mb-2">
        <label className="text-xs font-bold text-muted uppercase tracking-wider flex-1">Desconto PIX (%)</label>
        <span
          className="text-muted shrink-0"
          title="O desconto é aplicado no carrinho quando o cliente escolhe PIX. Ex: 5 = 5% de desconto."
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
        Aplicado automaticamente quando o cliente selecionar PIX (carrinho WhatsApp ou checkout no site).
      </p>

      </div>

      <div className={adminCard}>
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

      </div>

      <div className={adminCard}>
      <SectionHeader
        title="Banners da vitrine"
        description="Faixa de aviso no topo da loja. Várias mensagens ativas alternam a cada 6 segundos."
      />
      <p className="text-xs text-muted mb-3 break-words">
        Uma mensagem curta (até {BANNER_TEXT_MAX_CHARS} caracteres). Ative a pulsação leve para destacar no celular.
      </p>
      <div className="flex flex-wrap justify-end gap-2 mb-3">
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
            <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <label htmlFor={`banner-text-${m.id}`} className="text-[10px] text-muted">
                    Mensagem do banner
                  </label>
                  <button
                    type="button"
                    onClick={() => generateBannerText(m.id)}
                    disabled={generatingId === m.id}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline min-h-[44px] px-1 disabled:opacity-60"
                  >
                    <Sparkles size={14} aria-hidden />
                    {generatingId === m.id ? 'Gerando…' : 'Gerar com Vi'}
                  </button>
                </div>
                <textarea
                  id={`banner-text-${m.id}`}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground text-xs outline-none focus:border-primary min-h-[60px] resize-y placeholder:text-muted"
                  placeholder="Ex: Pague com PIX e ganhe 5% de desconto em toda a loja!"
                  value={m.text}
                  maxLength={BANNER_TEXT_MAX_CHARS}
                  onChange={e => updateBanner(m.id, { text: e.target.value })}
                />
                <p className="text-[10px] text-muted mt-1 tabular-nums">
                  {m.text.length}/{BANNER_TEXT_MAX_CHARS}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeBanner(m.id)}
                className="px-2 py-1 min-h-[44px] text-warm text-xs border border-warm/30 rounded-lg hover:bg-warm/10 shrink-0"
              >
                Remover
              </button>
            </div>

            <div className="mb-2 flex items-center justify-between gap-3 min-h-[44px]">
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground">Pulsação leve</p>
                <p className="text-[10px] text-muted break-words">
                  {normalizeBannerMotion(m.motion) === 'pulse' ? 'Texto com brilho suave' : 'Texto estático'}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={normalizeBannerMotion(m.motion) === 'pulse'}
                aria-label="Ativar pulsação leve no banner"
                onClick={() =>
                  updateBanner(m.id, {
                    motion: normalizeBannerMotion(m.motion) === 'pulse' ? 'none' : 'pulse',
                  })
                }
                className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
                  normalizeBannerMotion(m.motion) === 'pulse' ? 'bg-primary' : 'bg-muted/40'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    normalizeBannerMotion(m.motion) === 'pulse' ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {(bannerSuggestions[m.id]?.length ?? 0) > 1 && (
              <div className="mb-2">
                <p className="text-[10px] text-muted mb-1.5">Outras sugestões da Vi:</p>
                <div className="flex flex-col gap-1.5">
                  {bannerSuggestions[m.id].map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => updateBanner(m.id, { text: suggestion })}
                      className={`text-left text-xs px-3 py-2 rounded-lg border break-words min-h-[44px] ${
                        m.text === suggestion
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border bg-surface hover:border-primary/40'
                      }`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {m.text.trim() && (
              <div className="mb-2">
                <p className="text-[10px] text-muted mb-1.5">Prévia na vitrine</p>
                <BannerStrip
                  text={m.text}
                  motion={normalizeBannerMotion(m.motion)}
                  variant="admin-preview"
                />
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted block mb-1">Exibir de</label>
                <input
                  type="date"
                  className="w-full min-h-[44px] px-3 py-1.5 bg-surface border border-border rounded-lg text-foreground text-xs"
                  value={m.startDate ?? ''}
                  onChange={e => updateBanner(m.id, { startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[10px] text-muted block mb-1">Até</label>
                <input
                  type="date"
                  className="w-full min-h-[44px] px-3 py-1.5 bg-surface border border-border rounded-lg text-foreground text-xs"
                  value={m.endDate ?? ''}
                  onChange={e => updateBanner(m.id, { endDate: e.target.value })}
                />
              </div>
            </div>
          </div>
        ))
      )}

      </div>

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
