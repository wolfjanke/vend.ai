'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  onToken: (token: string) => void
  onError: (msg: string) => void
}

declare global {
  interface Window {
    AsaasCheckout?: {
      tokenizeCard: (data: {
        number:          string
        holderName:      string
        expiryMonth:     string
        expiryYear:      string
        ccv:             string
      }) => Promise<{ creditCardToken: string }>
    }
  }
}

export default function CardPayment({ onToken, onError }: Props) {
  const [loaded, setLoaded]   = useState(false)
  const [number, setNumber]   = useState('')
  const [holder, setHolder]   = useState('')
  const [expiry, setExpiry]   = useState('')
  const [cvv, setCvv]         = useState('')
  const [busy, setBusy]       = useState(false)
  const scriptRef             = useRef(false)

  useEffect(() => {
    if (scriptRef.current) return
    scriptRef.current = true

    const script    = document.createElement('script')
    script.src      = 'https://sandbox.asaas.com/checkout/creditCard/checkout.js'
    script.async    = true
    script.onload   = () => setLoaded(true)
    script.onerror  = () => onError('Falha ao carregar SDK de cartão.')
    document.body.appendChild(script)
  }, [onError])

  async function handleTokenize() {
    if (!window.AsaasCheckout) {
      onError('SDK de cartão não carregado.')
      return
    }
    if (!number || !holder || !expiry || !cvv) {
      onError('Preencha todos os dados do cartão.')
      return
    }

    const [expMonth, expYear] = expiry.split('/')
    if (!expMonth || !expYear) {
      onError('Validade inválida. Use MM/AA.')
      return
    }

    setBusy(true)
    try {
      const result = await window.AsaasCheckout.tokenizeCard({
        number:      number.replace(/\s/g, ''),
        holderName:  holder.toUpperCase(),
        expiryMonth: expMonth.trim(),
        expiryYear:  `20${expYear.trim()}`,
        ccv:         cvv,
      })
      onToken(result.creditCardToken)
    } catch {
      onError('Dados do cartão inválidos. Verifique e tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  const inputCls = 'w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-sm outline-none focus:border-primary transition-all'

  if (!loaded) return (
    <div className="text-center text-muted text-sm py-4">Carregando dados do cartão...</div>
  )

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">Número do cartão</label>
        <input
          className={inputCls}
          value={number}
          onChange={e => setNumber(e.target.value)}
          placeholder="0000 0000 0000 0000"
          maxLength={19}
          inputMode="numeric"
          autoComplete="cc-number"
        />
        <p className="text-[10px] text-muted mt-1 break-words">Dados tokenizados pelo Asaas — não ficam nos nossos servidores.</p>
      </div>
      <div>
        <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">Nome no cartão</label>
        <input className={inputCls} value={holder} onChange={e => setHolder(e.target.value)} placeholder="NOME SOBRENOME" autoComplete="cc-name" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">Validade</label>
          <input className={inputCls} value={expiry} onChange={e => setExpiry(e.target.value)} placeholder="MM/AA" maxLength={5} autoComplete="cc-exp" />
        </div>
        <div>
          <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">CVV</label>
          <input className={inputCls} value={cvv} onChange={e => setCvv(e.target.value)} placeholder="000" maxLength={4} inputMode="numeric" autoComplete="cc-csc" type="password" />
        </div>
      </div>
      <button
        type="button"
        onClick={handleTokenize}
        disabled={busy}
        className="w-full min-h-[44px] py-3 border border-primary text-primary font-syne font-semibold text-sm rounded-xl hover:bg-primary/10 transition-all disabled:opacity-70"
      >
        {busy ? 'Validando…' : 'Usar este cartão'}
      </button>
    </div>
  )
}
