'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import BrandLogo from '@/components/BrandLogo'

function AguardandoForm() {
  const searchParams = useSearchParams()
  const initialEmail = searchParams.get('email') ?? ''

  const [email, setEmail] = useState(initialEmail)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleResend(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      setError('Informe seu e-mail.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (res.status === 429) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Muitas tentativas. Aguarde.')
      }
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao reenviar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <p className="text-sm text-muted text-center mb-6 break-words">
        {done
          ? 'Se existir uma conta pendente com esse e-mail, enviamos um novo link de confirmação.'
          : initialEmail
            ? (
              <>
                Enviamos um link para{' '}
                <span className="text-foreground font-medium break-all">{initialEmail}</span>.
                {' '}Abra o e-mail e toque em &quot;Confirmar e-mail&quot; para acessar o painel.
              </>
            )
            : 'Informe o e-mail usado no cadastro para reenviar o link de confirmação.'}
      </p>

      {!done && (
        <form onSubmit={handleResend} className="flex flex-col gap-3">
          <input
            type="email"
            required
            className="w-full min-h-[44px] px-4 py-3.5 bg-surface2 border border-border rounded-[14px] text-foreground text-sm outline-none focus:border-primary placeholder:text-muted"
            placeholder="Seu e-mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          {error && <p className="text-sm text-warm break-words">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] rounded-[14px] bg-grad text-bg font-syne font-bold disabled:opacity-60"
          >
            {loading ? 'Enviando…' : 'Reenviar link'}
          </button>
        </form>
      )}

      <p className="text-center text-sm text-muted mt-6">
        <Link href="/admin" className="text-primary hover:underline">← Voltar ao login</Link>
      </p>
    </>
  )
}

export default function VerificarEmailAguardandoPage() {
  return (
    <main className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-surface border border-border rounded-[28px] p-6 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.4)] animate-fade-up">
        <div className="flex justify-center mb-6">
          <BrandLogo size="xl" />
        </div>
        <h1 className="font-syne font-bold text-xl sm:text-2xl mb-2 text-center">Confirme seu e-mail</h1>
        <Suspense fallback={<p className="text-center text-muted text-sm">Carregando…</p>}>
          <AguardandoForm />
        </Suspense>
      </div>
    </main>
  )
}
