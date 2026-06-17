'use client'

import { useCallback, useState } from 'react'
import { digitsOnly } from '@/lib/masks'
import MaskedInput from '@/components/ui/MaskedInput'

export interface CnpjLookupData {
  razaoSocial:  string
  nomeFantasia: string
  cep:          string
  logradouro:   string
  numero:       string
  bairro:       string
  cidade:       string
  uf:           string
}

interface Props {
  value:      string
  onChange:   (cnpj: string) => void
  onFilled:   (data: CnpjLookupData) => void
  className?: string
  disabled?:  boolean
}

export default function CnpjInput({ value, onChange, onFilled, className, disabled }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  const fetchCnpj = useCallback(
    async (cnpjDigits: string) => {
      if (cnpjDigits.length !== 14) return
      setStatus('loading')
      setMsg('')
      try {
        const res = await fetch(`/api/cnpj/${cnpjDigits}`)
        const data = await res.json() as CnpjLookupData & { error?: string }
        if (!res.ok) {
          setStatus('error')
          setMsg(data.error ?? (res.status === 404 ? 'CNPJ não encontrado' : 'Erro ao buscar CNPJ'))
          return
        }
        setStatus('idle')
        onFilled(data)
      } catch {
        setStatus('error')
        setMsg('Erro ao buscar CNPJ')
      }
    },
    [onFilled],
  )

  function handleChange(v: string) {
    onChange(v)
    const d = digitsOnly(v)
    if (d.length === 14) void fetchCnpj(d)
    else {
      setStatus('idle')
      setMsg('')
    }
  }

  return (
    <div className="w-full min-w-0">
      <div className="flex items-center gap-2">
        <MaskedInput
          mask="cnpj"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder="00.000.000/0000-00"
          className={`flex-1 min-w-0 px-4 py-3 bg-surface2 border border-border rounded-[12px] text-foreground text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-dim)] transition-all placeholder:text-muted min-h-[44px] ${className ?? ''}`}
        />
        {status === 'loading' && (
          <span className="text-xs text-muted shrink-0" aria-live="polite">Buscando…</span>
        )}
      </div>
      {status === 'error' && msg && (
        <p className="text-xs text-warm mt-1 break-words">{msg}</p>
      )}
    </div>
  )
}
