'use client'

import { useCallback, useState } from 'react'
import { digitsOnly } from '@/lib/masks'
import MaskedInput from '@/components/ui/MaskedInput'

export interface ViaCepResponse {
  cep:         string
  logradouro:  string
  bairro:      string
  localidade:  string
  uf:          string
  erro?:       boolean
}

interface Props {
  value:       string
  onChange:    (cep: string) => void
  onFilled:    (data: { logradouro: string; bairro: string; cidade: string; uf: string }) => void
  className?:  string
  disabled?:   boolean
}

export default function CepInput({ value, onChange, onFilled, className, disabled }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  const fetchCep = useCallback(
    async (cepDigits: string) => {
      if (cepDigits.length !== 8) return
      setStatus('loading')
      setMsg('')
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`)
        const data: ViaCepResponse = await res.json()
        if (!res.ok || data.erro) {
          setStatus('error')
          setMsg('CEP não encontrado')
          return
        }
        setStatus('idle')
        onFilled({
          logradouro: data.logradouro ?? '',
          bairro:     data.bairro ?? '',
          cidade:     data.localidade ?? '',
          uf:         (data.uf ?? '').toUpperCase(),
        })
      } catch {
        setStatus('error')
        setMsg('Erro ao buscar CEP')
      }
    },
    [onFilled]
  )

  function handleCepChange(v: string) {
    onChange(v)
    const d = digitsOnly(v)
    if (d.length === 8) void fetchCep(d)
    else {
      setStatus('idle')
      setMsg('')
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <MaskedInput
          mask="cep"
          value={value}
          onChange={handleCepChange}
          disabled={disabled}
          placeholder="00000-000"
          className={`flex-1 min-w-0 px-4 py-3 bg-surface2 border border-border rounded-[12px] text-foreground text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-dim)] transition-all placeholder:text-muted ${className ?? ''}`}
        />
        {status === 'loading' && (
          <span className="text-xs text-muted shrink-0" aria-live="polite">Buscando…</span>
        )}
      </div>
      {status === 'error' && msg && (
        <p className="text-xs text-warm mt-1">{msg}</p>
      )}
    </div>
  )
}
