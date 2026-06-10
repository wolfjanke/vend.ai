'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  storeSlug:     string
  paymentId:     string
  statusToken:   string
  pixQrCode:     string
  pixCopiaECola: string
  orderNumber:   string
  total:         number
  onConfirmed:   () => void
}

const PIX_TIMEOUT = 15 * 60 // 15 minutos

export default function PixPayment({
  storeSlug, paymentId, statusToken, pixQrCode, pixCopiaECola, orderNumber, onConfirmed,
}: Props) {
  const [copied, setCopied]     = useState(false)
  const [timeLeft, setTimeLeft] = useState(PIX_TIMEOUT)
  const [expired, setExpired]   = useState(false)
  const intervalRef             = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollingRef              = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setExpired(true)
          clearInterval(intervalRef.current!)
          clearInterval(pollingRef.current!)
          return 0
        }
        return t - 1
      })
    }, 1000)

    pollingRef.current = setInterval(async () => {
      try {
        const q = new URLSearchParams({ token: statusToken })
        const res  = await fetch(`/api/checkout/${storeSlug}/status/${paymentId}?${q}`)
        const data = await res.json()
        if (data.status === 'CONFIRMED') {
          clearInterval(pollingRef.current!)
          clearInterval(intervalRef.current!)
          onConfirmed()
        }
      } catch {
        // ignora erros de rede
      }
    }, 3000)

    return () => {
      clearInterval(intervalRef.current!)
      clearInterval(pollingRef.current!)
    }
  }, [storeSlug, paymentId, statusToken, onConfirmed])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(pixCopiaECola)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      const inp = document.createElement('input')
      inp.value = pixCopiaECola
      document.body.appendChild(inp)
      inp.select()
      document.execCommand('copy')
      document.body.removeChild(inp)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const countdownStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

  if (expired) {
    return (
      <div className="text-center py-12 px-4">
        <h2 className="font-syne font-bold text-lg mb-2">PIX expirado</h2>
        <p className="text-muted text-sm mb-6 break-words">
          O prazo de 15 minutos acabou. Gere um novo código para continuar.
        </p>
        <a
          href={`/${storeSlug}/checkout`}
          className="inline-block min-h-[44px] px-6 py-3 bg-primary text-white font-semibold rounded-xl text-sm"
        >
          Tentar novamente
        </a>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 text-center max-w-md mx-auto">
      <h2 className="font-syne font-bold text-lg mb-1">Pague com PIX</h2>
      <p className="text-muted text-sm mb-1">Pedido {orderNumber}</p>
      <p className="text-xs text-warm font-semibold mb-4">Expira em {countdownStr}</p>

      {pixQrCode ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={pixQrCode.startsWith('data:') ? pixQrCode : `data:image/png;base64,${pixQrCode}`}
          alt="QR Code PIX"
          className="w-48 h-48 mx-auto mb-4 rounded-xl border border-border"
        />
      ) : (
        <div className="w-48 h-48 mx-auto mb-4 bg-surface2 rounded-xl flex items-center justify-center text-muted text-xs">
          QR Code indisponível
        </div>
      )}

      {pixCopiaECola && (
        <div className="mb-4">
          <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
            Copia e cola
          </p>
          <p className="text-xs font-mono break-all bg-surface2 p-3 rounded-xl border border-border text-left max-h-24 overflow-y-auto">
            {pixCopiaECola}
          </p>
          <button
            type="button"
            onClick={handleCopy}
            className="mt-3 w-full min-h-[44px] py-3 border border-primary text-primary font-semibold text-sm rounded-xl hover:bg-primary/10 transition-all"
          >
            {copied ? 'Copiado!' : 'Copiar código'}
          </button>
        </div>
      )}

      <p className="text-xs text-muted break-words">
        Aguardando confirmação do pagamento… A página atualiza automaticamente.
      </p>
    </div>
  )
}
