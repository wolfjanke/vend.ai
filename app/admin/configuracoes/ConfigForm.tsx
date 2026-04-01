'use client'

import { useState, useRef } from 'react'
import { signOut } from 'next-auth/react'
import type { Store, AgeGroup, GenderFocus, DeliveryZone } from '@/types'
import { getStoreProfile } from '@/types'
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
  const initialProfile = getStoreProfile(settings)
  const [genderFocus, setGenderFocus] = useState<GenderFocus>(initialProfile.genderFocus)
  const [ageGroup, setAgeGroup]       = useState<AgeGroup>(initialProfile.ageGroup)
  const [name,          setName]          = useState(store.name)
  const [wpp,           setWpp]           = useState(() => initialWppDisplay(store.whatsapp))
  const [logoUrl,       setLogoUrl]       = useState(store.logo_url ?? '')
  const [freteInfo,     setFreteInfo]     = useState(settings.freteInfo ?? '')
  const [pagamentoInfo, setPagamentoInfo] = useState(settings.pagamentoInfo ?? '')
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

  const initialCc = settings.checkoutChannels ?? {}
  const [siteEnabled, setSiteEnabled] = useState(initialCc.siteEnabled === true)
  const [whatsappEnabled, setWhatsappEnabled] = useState(initialCc.whatsappEnabled !== false)

  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>(() => {
    const z = settings.deliveryZones
    if (!Array.isArray(z) || !z.length) return []
    return z.map(row => ({
      id:   String(row.id ?? `z-${Math.random().toString(36).slice(2, 11)}`),
      city: String(row.city ?? ''),
      uf:   String(row.uf ?? '')
        .trim()
        .toUpperCase()
        .slice(0, 2),
      fee:  typeof row.fee === 'number' && Number.isFinite(row.fee) ? row.fee : 0,
    }))
  })

  const [freeShippingMinStr, setFreeShippingMinStr] = useState(() => {
    const v = settings.freeShippingMin
    if (v == null) return ''
    return String(v)
  })

  const [installmentsMaxStr, setInstallmentsMaxStr] = useState(() => {
    const v = settings.installmentsMaxNoInterest
    if (v == null || v === undefined) return ''
    return String(v)
  })

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

  function addDeliveryZone() {
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `z-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    setDeliveryZones(prev => [...prev, { id, city: '', uf: '', fee: 0 }])
  }

  function removeDeliveryZone(index: number) {
    setDeliveryZones(prev => prev.filter((_, i) => i !== index))
  }

  function updateDeliveryZone(index: number, patch: Partial<DeliveryZone>) {
    setDeliveryZones(prev =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row))
    )
  }

  async function handleSave() {
    if (!name.trim()) { setError('Nome da loja obrigatório.'); return }
    if (!siteEnabled && !whatsappEnabled) {
      setError('Ative pelo menos um canal: site ou WhatsApp.')
      return
    }
    const zonesPayload: DeliveryZone[] = deliveryZones
      .filter(z => z.city.trim() && z.uf.trim().length === 2)
      .map(z => ({
        id:   z.id.trim() || `z-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        city: z.city.trim(),
        uf:   z.uf.trim().toUpperCase().slice(0, 2),
        fee:  Math.max(0, Number(z.fee) || 0),
      }))

    let freeShippingMin: number | null = null
    if (freeShippingMinStr.trim() !== '') {
      const n = Number(freeShippingMinStr.replace(',', '.'))
      if (Number.isFinite(n) && n >= 0) freeShippingMin = n
    }

    let installmentsMaxNoInterest: number | null = null
    if (installmentsMaxStr.trim() !== '') {
      const n = parseInt(installmentsMaxStr.trim(), 10)
      if (Number.isFinite(n) && n >= 1 && n <= 48) installmentsMaxNoInterest = n
    }

    const body = {
      name:           name.trim(),
      whatsapp:       wpp,
      logo_url:       logoUrl.trim() || null,
      freteInfo:      freteInfo.trim(),
      pagamentoInfo:  pagamentoInfo.trim(),
      genderFocus,
      ageGroup,
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      uf: uf ? uf.toUpperCase() : '',
      checkoutChannels: {
        siteEnabled,
        whatsappEnabled,
      },
      deliveryZones:    zonesPayload,
      freeShippingMin,
      installmentsMaxNoInterest,
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
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data?.error ?? 'Erro ao salvar.')
      return
    }
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
          <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Perfil da loja</p>
          <p className="text-xs text-muted mb-3">Usado na Vi, na busca da loja e na análise de produtos por IA.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-muted block mb-1">Público principal</label>
              <select
                className="w-full min-h-[44px] px-4 py-3 bg-surface2 border border-border rounded-[12px] text-foreground text-sm outline-none focus:border-primary"
                value={genderFocus}
                onChange={e => setGenderFocus(e.target.value as GenderFocus)}
              >
                <option value="feminine">Feminino</option>
                <option value="masculine">Masculino</option>
                <option value="unisex">Unissex</option>
                <option value="mixed">Misto</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-muted block mb-1">Faixa etária</label>
              <select
                className="w-full min-h-[44px] px-4 py-3 bg-surface2 border border-border rounded-[12px] text-foreground text-sm outline-none focus:border-primary"
                value={ageGroup}
                onChange={e => setAgeGroup(e.target.value as AgeGroup)}
              >
                <option value="adult">Adulto</option>
                <option value="kids">Infantil</option>
                <option value="all">Todas as idades</option>
              </select>
            </div>
          </div>
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
          <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Zonas de entrega (checkout)</p>
          <p className="text-xs text-muted mb-3 break-words">
            Cadastre cidade e UF com a taxa. Lista vazia = entrega em qualquer lugar com frete R$ 0 (útil só com frete grátis mínimo abaixo). Com zonas, só essas cidades recebem entrega.
          </p>
          <div className="space-y-3">
            {deliveryZones.map((z, i) => (
              <div
                key={z.id}
                className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_4.5rem_6.5rem_auto] gap-2 items-end border border-border/60 rounded-xl p-3 bg-surface2/50"
              >
                <div className="min-w-0">
                  <label className="text-[11px] text-muted block mb-1">Cidade</label>
                  <input
                    className="w-full min-h-[44px] px-3 py-2.5 bg-surface2 border border-border rounded-xl text-sm min-w-0"
                    value={z.city}
                    onChange={e => updateDeliveryZone(i, { city: e.target.value })}
                    placeholder="Ex: Guarulhos"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted block mb-1">UF</label>
                  <input
                    className="w-full min-h-[44px] px-2 py-2.5 bg-surface2 border border-border rounded-xl text-sm uppercase text-center"
                    maxLength={2}
                    value={z.uf}
                    onChange={e => updateDeliveryZone(i, { uf: e.target.value.toUpperCase() })}
                    placeholder="SP"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted block mb-1">Taxa (R$)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    className="w-full min-h-[44px] px-2 py-2.5 bg-surface2 border border-border rounded-xl text-sm min-w-0"
                    value={Number.isFinite(z.fee) ? z.fee : 0}
                    onChange={e => {
                      const v = parseFloat(e.target.value)
                      updateDeliveryZone(i, { fee: Number.isFinite(v) ? Math.max(0, v) : 0 })
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeDeliveryZone(i)}
                  className="min-h-[44px] px-3 border border-warm/30 text-warm text-xs rounded-xl hover:bg-warm/10 shrink-0 justify-self-start sm:justify-self-end"
                >
                  Remover
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addDeliveryZone}
              className="w-full min-h-[44px] border border-dashed border-border rounded-xl text-sm text-muted hover:text-foreground hover:border-muted transition-colors"
            >
              + Adicionar cidade
            </button>
          </div>
          <div className="mt-4">
            <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">
              Frete grátis a partir do pedido (R$)
            </label>
            <input
              type="text"
              inputMode="decimal"
              className="w-full min-h-[44px] px-4 py-3 bg-surface2 border border-border rounded-[12px] text-foreground text-sm outline-none focus:border-primary min-w-0"
              value={freeShippingMinStr}
              onChange={e => setFreeShippingMinStr(e.target.value)}
              placeholder="Ex: 150 (subtotal após cupom)"
            />
            <p className="text-xs text-muted mt-1.5 break-words">
              Deixe em branco para não aplicar frete grátis automático. O valor considera o subtotal após desconto do cupom.
            </p>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Formas de pagamento</label>
          <textarea
            className="w-full px-4 py-3 bg-surface2 border border-border rounded-[12px] text-foreground text-sm outline-none focus:border-primary min-h-[80px] resize-y placeholder:text-muted"
            value={pagamentoInfo}
            onChange={e => setPagamentoInfo(e.target.value)}
            placeholder="Ex: Parcele em até 3x sem juros."
          />
          <p className="text-xs text-muted mt-1.5">A Vi usa esse texto quando o cliente perguntar sobre pagamento.</p>
          <div className="mt-4">
            <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">
              Parcelamento na vitrine (sem juros)
            </label>
            <input
              type="number"
              min={1}
              max={48}
              inputMode="numeric"
              className="w-full min-h-[44px] max-w-[120px] px-4 py-3 bg-surface2 border border-border rounded-[12px] text-foreground text-sm outline-none focus:border-primary"
              value={installmentsMaxStr}
              onChange={e => setInstallmentsMaxStr(e.target.value)}
              placeholder="Ex: 6"
            />
            <p className="text-xs text-muted mt-1.5 break-words">
              Número máximo de parcelas sem juros usado na loja para exibir &quot;Nx R$ …&quot; em cada produto. Deixe em branco para não mostrar essa linha.
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Finalização do pedido (checkout)</p>
          <p className="text-xs text-muted mb-3 break-words">
            O cliente vê essas opções após informar o endereço. Pelo menos um canal deve ficar ativo.
          </p>
          <div className="flex flex-col gap-3">
            <label className="flex items-start gap-3 min-h-[44px] cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 size-4 shrink-0 accent-primary"
                checked={whatsappEnabled}
                onChange={e => setWhatsappEnabled(e.target.checked)}
              />
              <span className="text-sm text-foreground">
                <span className="font-semibold">WhatsApp</span>
                <span className="block text-xs text-muted">Enviar o pedido e combinar pagamento no chat (PIX, cartão na entrega, dinheiro).</span>
              </span>
            </label>
            <label className="flex items-start gap-3 min-h-[44px] cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 size-4 shrink-0 accent-primary"
                checked={siteEnabled}
                onChange={e => setSiteEnabled(e.target.checked)}
              />
              <span className="text-sm text-foreground">
                <span className="font-semibold">Site</span>
                <span className="block text-xs text-muted">Opção “pagar no site” com aviso; o pedido segue para o WhatsApp com os dados.</span>
              </span>
            </label>
          </div>
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
