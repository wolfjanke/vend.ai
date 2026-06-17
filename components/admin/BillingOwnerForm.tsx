'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import MaskedInput from '@/components/ui/MaskedInput'
import CnpjInput, { type CnpjLookupData } from '@/components/ui/CnpjInput'
import CepInput from '@/components/ui/CepInput'
import type { BillingOwnerInput } from '@/lib/validations'

export interface BillingOwnerFormInitial {
  type?: 'pf' | 'pj'
  legalName?: string | null
}

interface Props {
  ownerName:    string
  initial?:     BillingOwnerFormInitial
  submitLabel?: string
  loading?:     boolean
  onSubmit:     (data: BillingOwnerInput) => Promise<void>
}

const emptyAddress = {
  cep:         '',
  logradouro:  '',
  numero:      '',
  complemento: '',
  bairro:      '',
  cidade:      '',
  uf:          '',
}

export default function BillingOwnerForm({
  ownerName,
  initial,
  submitLabel = 'Salvar dados de cobrança',
  loading = false,
  onSubmit,
}: Props) {
  const [type, setType] = useState<'pf' | 'pj'>(initial?.type ?? 'pf')
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [legalName, setLegalName] = useState(initial?.legalName ?? '')
  const [showAddress, setShowAddress] = useState(initial?.type === 'pj')
  const [address, setAddress] = useState(emptyAddress)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function handleCnpjFilled(data: CnpjLookupData) {
    if (data.razaoSocial) setLegalName(data.razaoSocial)
    setShowAddress(true)
    setAddress(prev => ({
      ...prev,
      cep:        data.cep || prev.cep,
      logradouro: data.logradouro || prev.logradouro,
      numero:     data.numero || prev.numero,
      bairro:     data.bairro || prev.bairro,
      cidade:     data.cidade || prev.cidade,
      uf:         data.uf || prev.uf,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const payload: BillingOwnerInput = {
        type,
        cpfCnpj,
        legalName: type === 'pj' ? legalName : undefined,
        address: showAddress ? address : undefined,
      }
      await onSubmit(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setBusy(false)
    }
  }

  const disabled = loading || busy

  return (
    <form onSubmit={handleSubmit} className="space-y-4 min-w-0">
      <p className="text-xs text-muted break-words">
        Dados do titular da assinatura vendai.club (Asaas). Endereço de cobrança é separado do endereço da loja na vitrine.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setType('pf')}
          className={`min-h-[44px] px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${
            type === 'pf'
              ? 'bg-primary text-white border-primary'
              : 'border-border text-muted hover:border-primary'
          }`}
        >
          Pessoa física
        </button>
        <button
          type="button"
          onClick={() => { setType('pj'); setShowAddress(true) }}
          className={`min-h-[44px] px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${
            type === 'pj'
              ? 'bg-primary text-white border-primary'
              : 'border-border text-muted hover:border-primary'
          }`}
        >
          Pessoa jurídica
        </button>
      </div>

      {type === 'pf' ? (
        <div className="space-y-2">
          <label className="text-[11px] text-muted block">CPF</label>
          <MaskedInput
            mask="cpf"
            value={cpfCnpj}
            onChange={setCpfCnpj}
            disabled={disabled}
            placeholder="000.000.000-00"
            className="w-full min-h-[44px] px-4 py-3 bg-surface2 border border-border rounded-[12px] text-foreground text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-dim)] transition-all placeholder:text-muted"
          />
          <p className="text-xs text-muted break-words">
            Nome na cobrança: <span className="text-foreground font-medium">{ownerName || '—'}</span>
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-[11px] text-muted block">CNPJ</label>
          <CnpjInput
            value={cpfCnpj}
            onChange={setCpfCnpj}
            onFilled={handleCnpjFilled}
            disabled={disabled}
          />
          <label className="text-[11px] text-muted block">Razão social</label>
          <input
            value={legalName}
            onChange={e => setLegalName(e.target.value)}
            disabled={disabled}
            placeholder="Razão social"
            className="w-full min-h-[44px] px-4 py-3 bg-surface2 border border-border rounded-[12px] text-sm outline-none focus:border-primary"
          />
        </div>
      )}

      {type === 'pf' && (
        <button
          type="button"
          onClick={() => setShowAddress(v => !v)}
          className="text-sm text-primary font-semibold min-h-[44px] hover:underline"
        >
          {showAddress ? 'Ocultar endereço de cobrança' : 'Adicionar endereço de cobrança (opcional)'}
        </button>
      )}

      {showAddress && (
        <div className="space-y-2 pt-1 border-t border-border">
          <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Endereço de cobrança{type === 'pf' ? ' (opcional)' : ''}</p>
          <div>
            <label className="text-[11px] text-muted block mb-1">CEP</label>
            <CepInput
              value={address.cep}
              onChange={v => setAddress(a => ({ ...a, cep: v }))}
              onFilled={d => setAddress(a => ({
                ...a,
                logradouro: d.logradouro,
                bairro:     d.bairro,
                cidade:     d.cidade,
                uf:         d.uf,
              }))}
              disabled={disabled}
            />
          </div>
          <input
            className="w-full min-h-[44px] px-4 py-2.5 bg-surface2 border border-border rounded-xl text-sm"
            placeholder="Logradouro"
            value={address.logradouro}
            onChange={e => setAddress(a => ({ ...a, logradouro: e.target.value }))}
            disabled={disabled}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              className="w-full min-h-[44px] px-4 py-2.5 bg-surface2 border border-border rounded-xl text-sm"
              placeholder="Número"
              value={address.numero}
              onChange={e => setAddress(a => ({ ...a, numero: e.target.value }))}
              disabled={disabled}
            />
            <input
              className="w-full min-h-[44px] px-4 py-2.5 bg-surface2 border border-border rounded-xl text-sm"
              placeholder="Complemento"
              value={address.complemento}
              onChange={e => setAddress(a => ({ ...a, complemento: e.target.value }))}
              disabled={disabled}
            />
          </div>
          <input
            className="w-full min-h-[44px] px-4 py-2.5 bg-surface2 border border-border rounded-xl text-sm"
            placeholder="Bairro"
            value={address.bairro}
            onChange={e => setAddress(a => ({ ...a, bairro: e.target.value }))}
            disabled={disabled}
          />
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input
              className="w-full min-h-[44px] px-4 py-2.5 bg-surface2 border border-border rounded-xl text-sm min-w-0"
              placeholder="Cidade"
              value={address.cidade}
              onChange={e => setAddress(a => ({ ...a, cidade: e.target.value }))}
              disabled={disabled}
            />
            <input
              className="w-16 min-h-[44px] px-2 py-2.5 bg-surface2 border border-border rounded-xl text-sm uppercase text-center"
              placeholder="UF"
              maxLength={2}
              value={address.uf}
              onChange={e => setAddress(a => ({ ...a, uf: e.target.value.toUpperCase() }))}
              disabled={disabled}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-warm break-words">{error}</p>
      )}

      <button
        type="submit"
        disabled={disabled}
        className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
      >
        {disabled ? <Loader2 size={16} className="animate-spin mx-auto" /> : submitLabel}
      </button>
    </form>
  )
}
