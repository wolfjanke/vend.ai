'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import type { Store, BannerMessage } from '@/types'

interface Props {
  store: Store
}

export default function ConfigForm({ store }: Props) {
  const settings = store.settings_json ?? {}
  const [name,          setName]          = useState(store.name)
  const [wpp,           setWpp]           = useState(store.whatsapp)
  const [logoUrl,       setLogoUrl]       = useState(store.logo_url ?? '')
  const [freteInfo,     setFreteInfo]     = useState(settings.freteInfo ?? '')
  const [pagamentoInfo, setPagamentoInfo] = useState(settings.pagamentoInfo ?? '')
  const [bannerMessages, setBannerMessages] = useState<BannerMessage[]>(settings.bannerMessages ?? [])
  const [loading, setLoading] = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')

  function addBanner() {
    setBannerMessages(prev => [...prev, {
      id:        crypto.randomUUID(),
      title:     '',
      text:      '',
      startDate: '',
      endDate:   '',
    }])
  }
  function removeBanner(id: string) {
    setBannerMessages(prev => prev.filter(m => m.id !== id))
  }
  function updateBanner(id: string, field: keyof BannerMessage, value: string) {
    setBannerMessages(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m))
  }

  async function handleSave() {
    if (!name.trim()) { setError('Nome da loja obrigatório.'); return }
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/store', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:           name.trim(),
        whatsapp:       wpp.replace(/\D/g, ''),
        logo_url:       logoUrl.trim() || null,
        freteInfo:      freteInfo.trim(),
        pagamentoInfo:  pagamentoInfo.trim(),
        bannerMessages: bannerMessages.filter(m => m.text.trim()),
      }),
    })

    setLoading(false)
    if (!res.ok) { setError('Erro ao salvar.'); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <>
      <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-4">
        <div>
          <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Nome da loja</label>
          <input
            className="w-full px-4 py-3 bg-surface2 border border-border rounded-[12px] text-foreground text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-dim)] transition-all"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">WhatsApp</label>
          <input
            type="tel"
            className="w-full px-4 py-3 bg-surface2 border border-border rounded-[12px] text-foreground text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-dim)] transition-all placeholder:text-muted"
            value={wpp}
            onChange={e => setWpp(e.target.value)}
            placeholder="(11) 99999-9999"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Logo da loja (URL)</label>
          <input
            type="url"
            className="w-full px-4 py-3 bg-surface2 border border-border rounded-[12px] text-foreground text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-dim)] transition-all placeholder:text-muted"
            value={logoUrl}
            onChange={e => setLogoUrl(e.target.value)}
            placeholder="https://exemplo.com/logo.png"
          />
          <p className="text-xs text-muted mt-1.5">Cole o link de uma imagem para usar como logo.</p>
        </div>

        <div>
          <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Informações de frete</label>
          <textarea
            className="w-full px-4 py-3 bg-surface2 border border-border rounded-[12px] text-foreground text-sm outline-none focus:border-primary min-h-[80px] resize-y placeholder:text-muted"
            value={freteInfo}
            onChange={e => setFreteInfo(e.target.value)}
            placeholder="Ex: Frete grátis para São Paulo e Guarulhos. Demais cidades consulte."
          />
          <p className="text-xs text-muted mt-1.5">A Vi e o banner usam esse texto para informar o cliente.</p>
        </div>

        <div>
          <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Formas de pagamento / promoções</label>
          <textarea
            className="w-full px-4 py-3 bg-surface2 border border-border rounded-[12px] text-foreground text-sm outline-none focus:border-primary min-h-[80px] resize-y placeholder:text-muted"
            value={pagamentoInfo}
            onChange={e => setPagamentoInfo(e.target.value)}
            placeholder="Ex: PIX com 5% de desconto. Parcele em até 3x sem juros."
          />
          <p className="text-xs text-muted mt-1.5">A Vi usa esse texto quando o cliente perguntar sobre pagamento.</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-muted uppercase tracking-wider">Mensagens do banner</label>
            <button type="button" onClick={addBanner} className="text-xs text-primary font-semibold hover:underline">
              + Adicionar
            </button>
          </div>
          <p className="text-xs text-muted mb-2">Aparecem na loja em faixa rotativa. Opcional: datas para exibir em épocas (ex: Páscoa, Natal).</p>
          {bannerMessages.map(m => (
            <div key={m.id} className="mb-3 p-3 bg-surface2 border border-border rounded-xl">
              <div className="flex gap-2 mb-2">
                <input
                  className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-foreground text-xs outline-none focus:border-primary"
                  placeholder="Título (ex: Páscoa)"
                  value={m.title}
                  onChange={e => updateBanner(m.id, 'title', e.target.value)}
                />
                <button type="button" onClick={() => removeBanner(m.id)} className="px-2 py-1 text-warm text-xs border border-warm/30 rounded-lg hover:bg-warm/10">
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
                  className="px-3 py-1.5 bg-surface border border-border rounded-lg text-foreground text-xs"
                  placeholder="Início"
                  value={m.startDate ?? ''}
                  onChange={e => updateBanner(m.id, 'startDate', e.target.value)}
                />
                <input
                  type="date"
                  className="px-3 py-1.5 bg-surface border border-border rounded-lg text-foreground text-xs"
                  placeholder="Fim"
                  value={m.endDate ?? ''}
                  onChange={e => updateBanner(m.id, 'endDate', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        <div>
          <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Link da loja</label>
          <div className="flex items-center gap-2 px-4 py-3 bg-accent/10 border border-accent/30 rounded-[12px]">
            <span className="font-mono text-sm text-accent">
              {process.env.NEXT_PUBLIC_APP_URL}/{store.slug}
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL}/${store.slug}`)}
              className="ml-auto text-xs px-2 py-1 bg-accent text-bg rounded-lg font-bold"
            >
              Copiar
            </button>
          </div>
          <p className="text-xs text-muted mt-1.5">O slug não pode ser alterado após o cadastro.</p>
        </div>

        {error && <p className="text-sm text-warm">{error}</p>}

        <button
          onClick={handleSave}
          disabled={loading}
          className={`w-full py-3 rounded-[12px] font-syne font-bold text-sm transition-all ${
            saved ? 'bg-accent text-bg' : 'bg-primary text-white hover:shadow-[0_4px_20px_var(--primary-glow)]'
          } disabled:opacity-60`}
        >
          {loading ? 'Salvando…' : saved ? '✓ Salvo!' : 'Salvar alterações'}
        </button>
      </div>

      {/* Danger zone */}
      <div className="mt-6 bg-surface border border-warm/20 rounded-2xl p-6">
        <h3 className="font-syne font-bold text-sm text-warm mb-2">Zona de risco</h3>
        <p className="text-xs text-muted mb-4">Essas ações são irreversíveis.</p>
        <button
          onClick={() => signOut({ callbackUrl: '/admin' })}
          className="px-4 py-2.5 border border-warm/30 text-warm text-sm rounded-xl hover:bg-warm/10 transition-all"
        >
          Sair da conta
        </button>
      </div>
    </>
  )
}
