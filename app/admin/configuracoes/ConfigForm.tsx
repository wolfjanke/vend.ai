'use client'

import { useState, useRef } from 'react'
import { signOut } from 'next-auth/react'
import type { Store, BannerMessage } from '@/types'
import MaskedInput from '@/components/ui/MaskedInput'
import CepInput from '@/components/ui/CepInput'
import { storeSettingsPatchSchema } from '@/lib/validations'
import { maskPhone } from '@/lib/masks'

function initialWppDisplay(w: string) {
  const d = w.replace(/\D/g, '')
  const local = d.startsWith('55') && d.length > 11 ? d.slice(2) : d
  return maskPhone(local)
}

interface Props {
  store: Store
}

export default function ConfigForm({ store }: Props) {
  const settings = store.settings_json ?? {}
  const [name,          setName]          = useState(store.name)
  const [wpp,           setWpp]           = useState(() => initialWppDisplay(store.whatsapp))
  const [logoUrl,       setLogoUrl]       = useState(store.logo_url ?? '')
  const [freteInfo,     setFreteInfo]     = useState(settings.freteInfo ?? '')
  const [pagamentoInfo, setPagamentoInfo] = useState(settings.pagamentoInfo ?? '')
  const [bannerMessages, setBannerMessages] = useState<BannerMessage[]>(settings.bannerMessages ?? [])
  const [cep, setCep] = useState(store.cep ?? '')
  const [logradouro, setLogradouro] = useState(store.logradouro ?? '')
  const [numero, setNumero] = useState(store.numero ?? '')
  const [complemento, setComplemento] = useState(store.complemento ?? '')
  const [bairro, setBairro] = useState(store.bairro ?? '')
  const [cidade, setCidade] = useState(store.cidade ?? '')
  const [uf, setUf] = useState(store.uf ?? '')
  const [loading, setLoading] = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')

  const [pwdOpen, setPwdOpen] = useState(false)
  const [curPwd, setCurPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [pwdErr, setPwdErr] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

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

  async function uploadLogoFile(file: File) {
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const base64 = reader.result as string
        const res = await fetch('/api/upload', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ base64 }),
        })
        const data = await res.json()
        if (data.url) setLogoUrl(data.url)
        else setError('Falha no upload da logo')
      } catch {
        setError('Falha no upload da logo')
      }
    }
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    if (!name.trim()) { setError('Nome da loja obrigatório.'); return }
    const body = {
      name:           name.trim(),
      whatsapp:       wpp,
      logo_url:       logoUrl.trim() || null,
      freteInfo:      freteInfo.trim(),
      pagamentoInfo:  pagamentoInfo.trim(),
      bannerMessages: bannerMessages.filter(m => m.text.trim()),
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      uf: uf ? uf.toUpperCase() : '',
    }
    const parsed = storeSettingsPatchSchema.safeParse(body)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Verifique os campos.')
      return
    }

    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/store', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })

    setLoading(false)
    if (!res.ok) { setError('Erro ao salvar.'); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleChangePassword() {
    setPwdErr('')
    if (newPwd.length < 6) { setPwdErr('Nova senha: mínimo 6 caracteres.'); return }
    setPwdLoading(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ currentPassword: curPwd, newPassword: newPwd }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Erro')
      setPwdOpen(false)
      setCurPwd(''); setNewPwd('')
    } catch (e) {
      setPwdErr(e instanceof Error ? e.message : 'Erro')
    } finally {
      setPwdLoading(false)
    }
  }

  const baseUrl = typeof process.env.NEXT_PUBLIC_APP_URL === 'string' ? process.env.NEXT_PUBLIC_APP_URL : ''

  return (
    <>
      <div className="bg-surface border border-border rounded-2xl p-4 sm:p-6 flex flex-col gap-4">
        <div>
          <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Nome da loja</label>
          <input
            className="w-full min-h-[44px] px-4 py-3 bg-surface2 border border-border rounded-[12px] text-foreground text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-dim)] transition-all"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">WhatsApp</label>
          <MaskedInput
            mask="phone"
            className="w-full min-h-[44px] px-4 py-3 bg-surface2 border border-border rounded-[12px] text-foreground text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-dim)] transition-all placeholder:text-muted"
            placeholder="(11) 99999-9999"
            value={wpp}
            onChange={setWpp}
            autoComplete="tel"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Logo da loja</label>
          <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
            const f = e.target.files?.[0]
            if (f) void uploadLogoFile(f)
            e.target.value = ''
          }} />
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="min-h-[44px] px-4 py-2.5 bg-primary/10 border border-primary rounded-xl text-primary text-sm font-semibold hover:bg-primary/20"
            >
              Enviar imagem
            </button>
            <span className="text-xs text-muted">ou cole uma URL abaixo</span>
          </div>
          <input
            type="url"
            className="w-full min-h-[44px] mt-2 px-4 py-3 bg-surface2 border border-border rounded-[12px] text-foreground text-sm outline-none focus:border-primary transition-all placeholder:text-muted"
            value={logoUrl}
            onChange={e => setLogoUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>

        <div>
          <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Endereço da loja (opcional)</p>
          <div className="space-y-2">
            <div>
              <label className="text-[11px] text-muted block mb-1">CEP</label>
              <CepInput
                value={cep}
                onChange={setCep}
                onFilled={d => {
                  setLogradouro(d.logradouro)
                  setBairro(d.bairro)
                  setCidade(d.cidade)
                  setUf(d.uf)
                }}
              />
            </div>
            <input
              className="w-full min-h-[44px] px-4 py-2.5 bg-surface2 border border-border rounded-xl text-sm"
              placeholder="Logradouro"
              value={logradouro}
              onChange={e => setLogradouro(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className="w-full min-h-[44px] px-4 py-2.5 bg-surface2 border border-border rounded-xl text-sm"
                placeholder="Número"
                value={numero}
                onChange={e => setNumero(e.target.value)}
              />
              <input
                className="w-full min-h-[44px] px-4 py-2.5 bg-surface2 border border-border rounded-xl text-sm"
                placeholder="Complemento"
                value={complemento}
                onChange={e => setComplemento(e.target.value)}
              />
            </div>
            <input
              className="w-full min-h-[44px] px-4 py-2.5 bg-surface2 border border-border rounded-xl text-sm"
              placeholder="Bairro"
              value={bairro}
              onChange={e => setBairro(e.target.value)}
            />
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <input
                className="w-full min-h-[44px] px-4 py-2.5 bg-surface2 border border-border rounded-xl text-sm"
                placeholder="Cidade"
                value={cidade}
                onChange={e => setCidade(e.target.value)}
              />
              <input
                className="w-16 min-h-[44px] px-2 py-2.5 bg-surface2 border border-border rounded-xl text-sm uppercase text-center"
                placeholder="UF"
                maxLength={2}
                value={uf}
                onChange={e => setUf(e.target.value.toUpperCase())}
              />
            </div>
          </div>
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
                  className="flex-1 min-w-0 px-3 py-2 bg-surface border border-border rounded-lg text-foreground text-xs outline-none focus:border-primary"
                  placeholder="Título (ex: Páscoa)"
                  value={m.title}
                  onChange={e => updateBanner(m.id, 'title', e.target.value)}
                />
                <button type="button" onClick={() => removeBanner(m.id)} className="px-2 py-1 text-warm text-xs border border-warm/30 rounded-lg hover:bg-warm/10 shrink-0">
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
                  value={m.startDate ?? ''}
                  onChange={e => updateBanner(m.id, 'startDate', e.target.value)}
                />
                <input
                  type="date"
                  className="px-3 py-1.5 bg-surface border border-border rounded-lg text-foreground text-xs"
                  value={m.endDate ?? ''}
                  onChange={e => updateBanner(m.id, 'endDate', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        <div>
          <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Link da loja</label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3 bg-accent/10 border border-accent/30 rounded-[12px] min-w-0 overflow-hidden">
            <span className="font-mono text-xs sm:text-sm text-accent break-all min-w-0">
              {baseUrl}/{store.slug}
            </span>
            <button
              type="button"
              onClick={() => { if (baseUrl) void navigator.clipboard.writeText(`${baseUrl}/${store.slug}`) }}
              className="shrink-0 text-xs px-3 py-2 min-h-[44px] sm:min-h-0 bg-accent text-bg rounded-lg font-bold self-start sm:ml-auto"
            >
              Copiar
            </button>
          </div>
          <p className="text-xs text-muted mt-1.5">O slug não pode ser alterado após o cadastro.</p>
        </div>

        <button
          type="button"
          onClick={() => setPwdOpen(true)}
          className="w-full min-h-[44px] py-3 rounded-[12px] border border-border text-sm text-muted hover:text-foreground hover:border-muted transition-all"
        >
          Alterar senha
        </button>

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

      {pwdOpen && (
        <div className="fixed inset-0 z-[500] bg-bg/80 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-syne font-bold text-lg mb-4">Alterar senha</h3>
            <div className="flex flex-col gap-3">
              <input
                type="password"
                className="w-full min-h-[44px] px-4 py-3 bg-surface2 border border-border rounded-xl text-sm"
                placeholder="Senha atual"
                value={curPwd}
                onChange={e => setCurPwd(e.target.value)}
              />
              <input
                type="password"
                className="w-full min-h-[44px] px-4 py-3 bg-surface2 border border-border rounded-xl text-sm"
                placeholder="Nova senha (mín. 6 caracteres)"
                value={newPwd}
                onChange={e => setNewPwd(e.target.value)}
              />
              {pwdErr && <p className="text-sm text-warm">{pwdErr}</p>}
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => setPwdOpen(false)} className="flex-1 min-h-[44px] border border-border rounded-xl text-sm text-muted">
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={pwdLoading}
                  onClick={() => void handleChangePassword()}
                  className="flex-1 min-h-[44px] bg-primary text-white rounded-xl text-sm font-bold disabled:opacity-50"
                >
                  {pwdLoading ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 bg-surface border border-warm/20 rounded-2xl p-6">
        <h3 className="font-syne font-bold text-sm text-warm mb-2">Zona de risco</h3>
        <p className="text-xs text-muted mb-4">Essas ações são irreversíveis.</p>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/admin' })}
          className="px-4 py-2.5 border border-warm/30 text-warm text-sm rounded-xl hover:bg-warm/10 transition-all min-h-[44px]"
        >
          Sair da conta
        </button>
      </div>
    </>
  )
}
