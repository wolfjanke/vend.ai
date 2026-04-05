'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  storeId: string
}

export default function OnboardingForm({ storeId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const [form, setForm] = useState({
    name:          '',
    email:         '',
    cpfCnpj:       '',
    birthDate:     '',
    companyType:   'MEI',
    phone:         '',
    mobilePhone:   '',
    address:       '',
    addressNumber: '',
    province:      '',
    postalCode:    '',
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
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
        body:    JSON.stringify(form),
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

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className={labelCls}>Nome completo / Razão social</label>
        <input required className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Seu nome ou razão social" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>E-mail</label>
          <input required type="email" className={inputCls} value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@exemplo.com" />
        </div>
        <div>
          <label className={labelCls}>CPF / CNPJ</label>
          <input required className={inputCls} value={form.cpfCnpj} onChange={e => set('cpfCnpj', e.target.value)} placeholder="000.000.000-00" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Data de nascimento</label>
          <input required type="date" className={inputCls} value={form.birthDate} onChange={e => set('birthDate', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Tipo de empresa</label>
          <select required className={inputCls + ' appearance-none'} value={form.companyType} onChange={e => set('companyType', e.target.value)}>
            <option value="MEI">MEI</option>
            <option value="LIMITED">Ltda.</option>
            <option value="INDIVIDUAL">Empresário Individual</option>
            <option value="ASSOCIATION">Associação</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Telefone fixo</label>
          <input className={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(11) 3000-0000" />
        </div>
        <div>
          <label className={labelCls}>Celular</label>
          <input required className={inputCls} value={form.mobilePhone} onChange={e => set('mobilePhone', e.target.value)} placeholder="(11) 99000-0000" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>CEP</label>
          <input required className={inputCls} value={form.postalCode} onChange={e => set('postalCode', e.target.value)} placeholder="00000-000" />
        </div>
        <div>
          <label className={labelCls}>Bairro</label>
          <input required className={inputCls} value={form.province} onChange={e => set('province', e.target.value)} placeholder="Seu bairro" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className={labelCls}>Endereço (rua/av.)</label>
          <input required className={inputCls} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Rua Exemplo" />
        </div>
        <div>
          <label className={labelCls}>Número</label>
          <input required className={inputCls} value={form.addressNumber} onChange={e => set('addressNumber', e.target.value)} placeholder="123" />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-warm/10 border border-warm/30 rounded-xl text-warm text-sm break-words">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full min-h-[44px] py-3 bg-primary text-white font-syne font-bold text-sm rounded-xl hover:shadow-[0_4px_20px_var(--primary-glow)] transition-all disabled:opacity-70 disabled:cursor-wait"
      >
        {loading ? 'Ativando…' : 'Ativar recebimentos'}
      </button>
    </form>
  )
}
