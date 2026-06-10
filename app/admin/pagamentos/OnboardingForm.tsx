'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import MaskedInput from '@/components/ui/MaskedInput'
import CepInput from '@/components/ui/CepInput'
import type { SubaccountKind } from '@/lib/asaas/subaccount-payload'

interface Props {
  storeId: string
}

type FormState = {
  name:          string
  email:         string
  cpfCnpj:       string
  birthDate:     string
  companyType:   'LIMITED' | 'INDIVIDUAL' | 'ASSOCIATION'
  phone:         string
  mobilePhone:   string
  address:       string
  addressNumber: string
  province:      string
  postalCode:    string
}

const EMPTY_FORM: FormState = {
  name:          '',
  email:         '',
  cpfCnpj:       '',
  birthDate:     '',
  companyType:   'LIMITED',
  phone:         '',
  mobilePhone:   '',
  address:       '',
  addressNumber: '',
  province:      '',
  postalCode:    '',
}

export default function OnboardingForm({ storeId: _storeId }: Props) {
  const router = useRouter()
  const [accountKind, setAccountKind] = useState<SubaccountKind>('mei')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  function set(field: keyof FormState, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setError(null)
  }

  function switchKind(kind: SubaccountKind) {
    setAccountKind(kind)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/payments/subaccount', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          accountKind,
          ...form,
          companyType: accountKind === 'mei' ? undefined : form.companyType,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erro ao criar conta. Tente novamente.')
        return
      }
      router.refresh()
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary transition-all'
  const labelCls = 'text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5'
  const toggleBtn = (active: boolean) =>
    `flex-1 min-h-[44px] px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
      active
        ? 'bg-primary text-white shadow-[0_4px_16px_var(--primary-glow)]'
        : 'bg-surface2 border border-border text-muted hover:text-foreground'
    }`

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-2 gap-3">
      <div className="xl:col-span-2 space-y-2">
        <p className={labelCls}>Tipo de cadastro</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <button type="button" className={toggleBtn(accountKind === 'mei')} onClick={() => switchKind('mei')}>
            MEI (pessoa física)
          </button>
          <button type="button" className={toggleBtn(accountKind === 'pj')} onClick={() => switchKind('pj')}>
            Pessoa jurídica
          </button>
        </div>
        <p className="text-xs text-muted break-words">
          {accountKind === 'mei'
            ? 'MEI possui CNPJ próprio. CPF sozinho não é aceito pelo processador de pagamentos.'
            : 'Empresa com CNPJ (Ltda., empresário individual, associação etc.).'}
        </p>
      </div>

      <div className="xl:col-span-2">
        <label className={labelCls}>
          {accountKind === 'mei' ? 'Nome completo' : 'Razão social'}
        </label>
        <input
          required
          className={inputCls}
          value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder={accountKind === 'mei' ? 'Seu nome completo' : 'Razão social da empresa'}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xl:col-span-2">
        <div>
          <label className={labelCls}>E-mail</label>
          <input
            required
            type="email"
            className={inputCls}
            value={form.email}
            onChange={e => set('email', e.target.value)}
            placeholder="email@exemplo.com"
          />
        </div>
        <div>
          <label className={labelCls}>
            {accountKind === 'mei' ? 'CNPJ do MEI' : 'CNPJ'}
          </label>
          <MaskedInput
            required
            mask="cnpj"
            className={inputCls}
            value={form.cpfCnpj}
            onChange={v => set('cpfCnpj', v)}
            placeholder="00.000.000/0000-00"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xl:col-span-2">
        <div>
          <label className={labelCls}>Data de nascimento</label>
          <input
            required
            type="date"
            className={inputCls}
            value={form.birthDate}
            onChange={e => set('birthDate', e.target.value)}
          />
        </div>
        {accountKind === 'pj' && (
          <div>
            <label className={labelCls}>Tipo de empresa</label>
            <select
              required
              className={`${inputCls} appearance-none`}
              value={form.companyType}
              onChange={e => set('companyType', e.target.value as FormState['companyType'])}
            >
              <option value="LIMITED">Ltda.</option>
              <option value="INDIVIDUAL">Empresário individual</option>
              <option value="ASSOCIATION">Associação</option>
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xl:col-span-2">
        <div>
          <label className={labelCls}>Telefone fixo <span className="normal-case font-normal">(opcional)</span></label>
          <MaskedInput
            mask="phone"
            className={inputCls}
            value={form.phone}
            onChange={v => set('phone', v)}
            placeholder="(11) 3000-0000"
          />
        </div>
        <div>
          <label className={labelCls}>Celular</label>
          <MaskedInput
            required
            mask="phone"
            className={inputCls}
            value={form.mobilePhone}
            onChange={v => set('mobilePhone', v)}
            placeholder="(11) 99000-0000"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xl:col-span-2">
        <div>
          <label className={labelCls}>CEP</label>
          <CepInput
            value={form.postalCode}
            onChange={v => set('postalCode', v)}
            onFilled={({ logradouro, bairro }) => {
              if (logradouro) set('address', logradouro)
              if (bairro) set('province', bairro)
            }}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Bairro</label>
          <input
            required
            className={inputCls}
            value={form.province}
            onChange={e => set('province', e.target.value)}
            placeholder="Seu bairro"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 xl:col-span-2">
        <div className="col-span-2 min-w-0">
          <label className={labelCls}>Endereço (rua/av.)</label>
          <input
            required
            className={inputCls}
            value={form.address}
            onChange={e => set('address', e.target.value)}
            placeholder="Rua Exemplo"
          />
        </div>
        <div className="min-w-0">
          <label className={labelCls}>Número</label>
          <input
            required
            className={inputCls}
            value={form.addressNumber}
            onChange={e => set('addressNumber', e.target.value)}
            placeholder="123"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-warm/10 border border-warm/30 rounded-xl text-warm text-sm break-words xl:col-span-2">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full min-h-[44px] py-3 bg-primary text-white font-syne font-bold text-sm rounded-xl hover:shadow-[0_4px_20px_var(--primary-glow)] transition-all disabled:opacity-70 disabled:cursor-wait xl:col-span-2"
      >
        {loading ? 'Ativando…' : 'Ativar recebimentos'}
      </button>
    </form>
  )
}
