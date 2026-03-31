'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/auth/forgot-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim() }),
      })
      setDone(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-surface border border-border rounded-[28px] p-6 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.4)] animate-fade-up">
        <div className="font-syne font-extrabold text-2xl sm:text-3xl text-grad text-center mb-6">
          vend<span className="text-accent" style={{ WebkitTextFillColor: 'var(--accent)' }}>.</span>ai
        </div>
        <h1 className="font-syne font-bold text-xl sm:text-2xl mb-2 text-center">Esqueci minha senha</h1>
        <p className="text-sm text-muted text-center mb-6">
          {done
            ? 'Se existir uma conta com esse e-mail, você receberá um link para redefinir a senha.'
            : 'Informe seu e-mail cadastrado. Enviaremos um link de redefinição.'}
        </p>

        {!done ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              required
              className="w-full min-h-[44px] px-4 py-3 bg-surface2 border border-border rounded-[14px] text-foreground text-sm outline-none focus:border-primary"
              placeholder="E-mail"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[48px] rounded-[14px] bg-grad text-bg font-syne font-bold text-base disabled:opacity-60"
            >
              {loading ? 'Enviando…' : 'Enviar link'}
            </button>
          </form>
        ) : (
          <Link href="/admin" className="block text-center text-primary text-sm hover:underline py-3">
            Voltar ao login
          </Link>
        )}

        <p className="text-center text-sm text-muted mt-6">
          <Link href="/admin" className="text-primary hover:underline">← Voltar ao login</Link>
        </p>
      </div>
    </main>
  )
}
