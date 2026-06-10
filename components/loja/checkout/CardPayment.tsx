'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

export interface CardPaymentHandle {
  tokenize: () => Promise<string>
}

interface Props {
  asaasEnv: 'sandbox' | 'production'
  onError:  (msg: string) => void
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

function maskCardNumber(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 16)
  return d.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}

function maskExpiry(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 4)
  if (d.length <= 2) return d
  return `${d.slice(0, 2)}/${d.slice(2)}`
}

const CardPayment = forwardRef<CardPaymentHandle, Props>(function CardPayment(
  { asaasEnv, onError },
  ref,
) {
  const [loaded, setLoaded] = useState(false)
  const [number, setNumber] = useState('')
  const [holder, setHolder] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const scriptRef = useRef(false)

  const sdkUrl =
    asaasEnv === 'production'
      ? 'https://www.asaas.com/checkout/creditCard/checkout.js'
      : 'https://sandbox.asaas.com/checkout/creditCard/checkout.js'

  useEffect(() => {
    if (scriptRef.current) return
    scriptRef.current = true

    const script = document.createElement('script')
    script.src = sdkUrl
    script.async = true
    script.onload = () => setLoaded(true)
    script.onerror = () => onError('Falha ao carregar SDK de cartão.')
    document.body.appendChild(script)
  }, [sdkUrl, onError])

  useImperativeHandle(ref, () => ({
    async tokenize() {
      if (!window.AsaasCheckout) {
        throw new Error('SDK de cartão não carregado.')
      }
      if (!number || !holder || !expiry || !cvv) {
        throw new Error('Preencha todos os dados do cartão.')
      }

      const [expMonth, expYear] = expiry.split('/')
      if (!expMonth || !expYear) {
        throw new Error('Validade inválida. Use MM/AA.')
      }

      const result = await window.AsaasCheckout.tokenizeCard({
        number:      number.replace(/\s/g, ''),
        holderName:  holder.toUpperCase(),
        expiryMonth: expMonth.trim(),
        expiryYear:  `20${expYear.trim()}`,
        ccv:         cvv,
      })
      return result.creditCardToken
    },
  }))

  const inputCls = 'w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-sm outline-none focus:border-primary transition-all'

  if (!loaded) {
    return <div className="text-center text-muted text-sm py-4">Carregando dados do cartão...</div>
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">
          Número do cartão
        </label>
        <input
          className={inputCls}
          value={number}
          onChange={e => setNumber(maskCardNumber(e.target.value))}
          placeholder="0000 0000 0000 0000"
          maxLength={19}
          inputMode="numeric"
          autoComplete="cc-number"
        />
      </div>
      <div>
        <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">
          Nome no cartão
        </label>
        <input
          className={inputCls}
          value={holder}
          onChange={e => setHolder(e.target.value)}
          placeholder="NOME SOBRENOME"
          autoComplete="cc-name"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">
            Validade
          </label>
          <input
            className={inputCls}
            value={expiry}
            onChange={e => setExpiry(maskExpiry(e.target.value))}
            placeholder="MM/AA"
            maxLength={5}
            autoComplete="cc-exp"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">
            CVV
          </label>
          <input
            className={inputCls}
            value={cvv}
            onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="000"
            maxLength={4}
            inputMode="numeric"
            autoComplete="cc-csc"
            type="password"
          />
        </div>
      </div>
      <p className="text-[10px] text-muted break-words">
        Dados tokenizados pelo Asaas — não ficam nos nossos servidores.
      </p>
    </div>
  )
})

export default CardPayment
