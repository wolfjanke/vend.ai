'use client'

import { useState } from 'react'
import { createBrowser } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router   = useRouter()
  const supabase = createBrowser()

  const [email,   setEmail]   = useState('')
  const [pass,    setPass]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleLogin() {
    if (!email || !pass) { setError('Preencha e-mail e senha.'); return }
    setLoading(true)
    setError('')
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (authError) {
      setError('E-mail ou senha inválidos.')
      setLoading(false)
      return
    }
    router.push('/admin/dashboard')
  }

  return (
    <main className="relative z-10 min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-surface border border-border rounded-[28px] p-10 shadow-[0_20px_60px_rgba(0,0,0,0.4)] animate-fade-up">
        <div className="font-syne font-extrabold text-3xl text-grad text-center mb-8">
          vend<span className="text-accent" style={{ WebkitTextFillColor: 'var(--accent)' }}>.</span>ai
        </div>
        <h2 className="font-syne font-bold text-xl mb-1">Bem-vinda de volta!</h2>
        <p className="text-sm text-muted mb-6">Acesse o painel da sua loja</p>

        {error && (
          <div className="mb-4 px-4 py-3 bg-warm/10 border border-warm/30 rounded-xl text-warm text-sm">{error}</div>
        )}

        <div className="flex flex-col gap-3 mb-5">
          <input type="email" className="w-full px-4 py-3.5 bg-surface2 border border-border rounded-[14px] text-foreground text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-dim)] transition-all placeholder:text-muted" placeholder="📧 E-mail" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          <input type="password" className="w-full px-4 py-3.5 bg-surface2 border border-border rounded-[14px] text-foreground text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-dim)] transition-all placeholder:text-muted" placeholder="🔒 Senha" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        </div>

        <button onClick={handleLogin} disabled={loading} className="w-full py-3.5 rounded-[14px] bg-grad text-bg font-syne font-bold text-base hover:-translate-y-0.5 hover:shadow-[0_6px_25px_var(--primary-glow)] transition-all disabled:opacity-60 disabled:cursor-wait">
          {loading ? 'Entrando…' : 'Entrar →'}
        </button>

        <p className="text-center text-sm text-muted mt-4">
          Não tem conta?{' '}
          <a href="/cadastro" className="text-primary hover:underline">Criar grátis</a>
        </p>
      </div>
    </main>
  )
}
