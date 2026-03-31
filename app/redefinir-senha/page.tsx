'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function RedefinirForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [pass, setPass] = useState('')
  const [pass2, setPass2] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pass !== pass2) { setError('As senhas não coincidem.'); return }
    if (pass.length < 6) { setError('Mínimo 6 caracteres.'); return }
    if (!token) { setError('Link inválido.'); return }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, password: pass }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Erro ao redefinir')
      router.push('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="password"
        required
        minLength={6}
        className="w-full min-h-[44px] px-4 py-3 bg-surface2 border border-border rounded-[14px] text-sm outline-none focus:border-primary"
        placeholder="Nova senha"
        value={pass}
        onChange={e => setPass(e.target.value)}
      />
      <input
        type="password"
        required
        minLength={6}
        className="w-full min-h-[44px] px-4 py-3 bg-surface2 border border-border rounded-[14px] text-sm outline-none focus:border-primary"
        placeholder="Confirmar nova senha"
        value={pass2}
        onChange={e => setPass2(e.target.value)}
      />
      {error && <p className="text-sm text-warm">{error}</p>}
      <button
        type="submit"
        disabled={loading || !token}
        className="w-full min-h-[48px] rounded-[14px] bg-grad text-bg font-syne font-bold disabled:opacity-60"
      >
        {loading ? 'Salvando…' : 'Redefinir senha'}
      </button>
    </form>
  )
}

export default function RedefinirSenhaPage() {
  return (
    <main className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-surface border border-border rounded-[28px] p-6 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.4)] animate-fade-up">
        <h1 className="font-syne font-bold text-xl sm:text-2xl mb-2 text-center">Nova senha</h1>
        <p className="text-sm text-muted text-center mb-6">Escolha uma senha segura para sua conta.</p>
        <Suspense fallback={<p className="text-center text-muted text-sm">Carregando…</p>}>
          <RedefinirForm />
        </Suspense>
        <p className="text-center text-sm text-muted mt-6">
          <Link href="/admin" className="text-primary hover:underline">← Voltar ao login</Link>
        </p>
      </div>
    </main>
  )
}
