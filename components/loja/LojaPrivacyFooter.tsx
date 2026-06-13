'use client'

import { useState } from 'react'
import Link from 'next/link'
import MaskedInput from '@/components/ui/MaskedInput'
import { digitsOnly } from '@/lib/masks'

interface Props {
  storeSlug: string
}

export default function LojaPrivacyFooter({ storeSlug }: Props) {
  const [open, setOpen] = useState(false)
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')

    const digits = digitsOnly(phone)
    if (digits.length < 10) {
      setError('Informe um WhatsApp válido (DDD + número).')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/privacidade/exclusao', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ storeSlug, customerWhatsapp: digits }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Não foi possível processar a solicitação.')
        return
      }
      setMessage(typeof data.message === 'string' ? data.message : 'Solicitação processada.')
      setPhone('')
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <footer className="px-4 sm:px-6 py-6 mt-8 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 min-w-0">
          <p className="text-xs text-muted break-words">
            <Link href="/privacidade" target="_blank" className="hover:text-foreground transition-colors">
              Política de Privacidade
            </Link>
            <span className="text-border px-1.5" aria-hidden>·</span>
            <button
              type="button"
              onClick={() => {
                setOpen(true)
                setError('')
                setMessage('')
              }}
              className="hover:text-foreground transition-colors text-left"
            >
              Exercer seus direitos (LGPD)
            </button>
          </p>
          <p className="text-[11px] text-muted/70 break-words">
            Dados tratados conforme a LGPD. Operador: vend.ai.
          </p>
        </div>
      </footer>

      {open && (
        <div
          className="fixed inset-0 z-[500] bg-bg/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lgpd-dialog-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-surface border border-border rounded-2xl p-5 sm:p-6 w-full max-w-md max-h-[calc(100vh-32px)] overflow-y-auto shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 id="lgpd-dialog-title" className="font-syne font-bold text-lg mb-2">
              Solicitar anonimização de dados
            </h2>
            <p className="text-sm text-muted mb-4 break-words leading-relaxed">
              Se você é cliente desta loja e quer que seus dados pessoais nos pedidos sejam anonimizados,
              informe o WhatsApp usado no pedido. O processamento é imediato, conforme a{' '}
              <Link href="/privacidade" target="_blank" className="text-primary underline">
                Política de Privacidade
              </Link>.
            </p>

            <form onSubmit={e => void handleSubmit(e)} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">
                  WhatsApp do pedido
                </label>
                <MaskedInput
                  mask="phone"
                  value={phone}
                  onChange={setPhone}
                  placeholder="(00) 00000-0000"
                  className="w-full min-h-[44px] px-4 py-3 bg-surface2 border border-border rounded-xl text-sm outline-none focus:border-primary"
                  autoComplete="tel"
                />
              </div>

              {error && <p className="text-sm text-warm break-words">{error}</p>}
              {message && <p className="text-sm text-primary break-words">{message}</p>}

              <div className="flex flex-col sm:flex-row gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 min-h-[44px] border border-border rounded-xl text-sm text-muted hover:text-foreground transition-colors"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 min-h-[44px] bg-primary text-white rounded-xl text-sm font-bold disabled:opacity-50"
                >
                  {loading ? 'Processando…' : 'Solicitar anonimização'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
