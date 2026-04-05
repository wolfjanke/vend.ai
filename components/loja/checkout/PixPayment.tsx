'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  paymentId:     string
  pixQrCode:     string
  pixCopiaECola: string
  orderNumber:   string
  onConfirmed:   () => void
}

const PIX_TIMEOUT = 30 * 60 // 30 minutos em segundos

export default function PixPayment({ paymentId, pixQrCode, pixCopiaECola, orderNumber, onConfirmed }: Props) {
  const [copied, setCopied]     = useState(false)
  const [timeLeft, setTimeLeft] = useState(PIX_TIMEOUT)
  const [expired, setExpired]   = useState(false)
  const intervalRef             = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollingRef              = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    // Countdown timer
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setExpired(true)
          clearInterval(intervalRef.current!)
          return 0
        }
        return t - 1
      })
    }, 1000)

    // Polling de status a cada 3 segundos
    pollingRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`/api/checkout/status?id=${paymentId}`)
        const data = await res.json()
        if (data.status === 'CONFIRMED') {
          clearInterval(pollingRef.current!)
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
  }, [paymentId, onConfirmed])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(pixCopiaECola)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      // fallback: criar input temporário
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
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⏰</div>
        <h2 className="font-syne font-bold text-lg mb-2">PIX expirado</h2>
        <p className="text-muted text-sm mb-6">O código PIX expirou após 30 minutos.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-primary text-white font-syne font-bold text-sm rounded-xl min-h-[44px] hover:shadow-[0_4px_20px_var(--primary-glow)] transition-all"
        >
          Gerar novo PIX
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="font-syne font-bold text-lg mb-1">Pague com PIX</h2>
        <p className="text-sm text-muted">Pedido {orderNumber} — expira em <span className="font-mono text-foreground">{countdownStr}</span></p>
      </div>

      {/* QR Code */}
      {pixQrCode && (
        <div className="flex justify-center">
          <div className="bg-white p-3 rounded-2xl shadow-inner">
            <img
              src={`data:image/png;base64,${pixQrCode}`}
              alt="QR Code PIX"
              className="w-48 h-48 sm:w-56 sm:h-56"
            />
          </div>
        </div>
      )}

      {/* Copia e Cola */}
      {pixCopiaECola && (
        <div className="bg-surface border border-border rounded-2xl p-4">
          <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Código PIX copia e cola</div>
          <div className="font-mono text-xs break-all text-muted bg-surface2 rounded-xl px-3 py-2 mb-3 leading-relaxed">
            {pixCopiaECola.slice(0, 60)}...
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="w-full min-h-[44px] py-3 border border-primary text-primary font-syne font-semibold text-sm rounded-xl hover:bg-primary/10 transition-all"
          >
            {copied ? '✓ Copiado!' : 'Copiar código PIX'}
          </button>
        </div>
      )}

      <div className="p-3 bg-surface border border-border rounded-xl text-xs text-muted space-y-1 break-words">
        <p className="font-semibold text-foreground">Como pagar:</p>
        <ol className="list-decimal list-inside space-y-0.5">
          <li>Abra o app do seu banco</li>
          <li>Vá em PIX → Pagar → Copia e Cola</li>
          <li>Cole o código acima e confirme</li>
          <li>Esta página atualiza automaticamente após o pagamento</li>
        </ol>
      </div>
    </div>
  )
}
