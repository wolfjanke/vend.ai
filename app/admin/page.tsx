'use client'

import { useState } from 'react'
import Link from 'next/link'
import { loginWithCredentials } from '@/lib/client-login'
import { Eye, EyeOff } from 'lucide-react'
import BrandLogo from '@/components/BrandLogo'

export default function AdminLoginPage() {
  const [email,   setEmail]   = useState('')
  const [pass,    setPass]    = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState('')

  async function handleLogin() {
    if (!email || !pass) { setError('Preencha e-mail e senha.'); return }
    setLoading(true)
    setError('')
    setPendingVerifyEmail('')

    const res = await loginWithCredentials(email, pass)

    if (!res.ok) {
      setError(res.error)
      if (res.emailNotVerified) {
        setPendingVerifyEmail(email.trim())
      }
      setLoading(false)
      return
    }

    // Navegação completa: o layout do admin é RSC e foi gerado sem sessão na /admin;
    // só com router.push o Next reutiliza esse shell e some o menu até um F5.
    window.location.assign('/admin/dashboard')
  }

  return (
    <main className="relative z-10 min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-surface border border-border rounded-[28px] p-10 shadow-[0_20px_60px_rgba(0,0,0,0.4)] animate-fade-up">
        <div className="flex justify-center mb-8">
          <BrandLogo size="xl" />
        </div>
        <h2 className="font-syne font-bold text-xl mb-1">Bem-vinda de volta!</h2>
        <p className="text-sm text-muted mb-6">Acesse o painel da sua loja</p>

        {error && (
          <div className="mb-4 px-4 py-3 bg-warm/10 border border-warm/30 rounded-xl text-warm text-sm break-words">
            {error}
            {pendingVerifyEmail && (
              <p className="mt-2 text-foreground/90">
                <Link
                  href={`/verificar-email/aguardando?email=${encodeURIComponent(pendingVerifyEmail)}`}
                  className="text-primary font-medium hover:underline"
                >
                  Reenviar e-mail de confirmação →
                </Link>
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3 mb-5">
          <input
            type="email"
            className="w-full min-h-[44px] px-4 py-3.5 bg-surface2 border border-border rounded-[14px] text-foreground text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-dim)] transition-all placeholder:text-muted"
            placeholder="Seu e-mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
          <div className="relative min-w-0">
            <input
              type={showPass ? 'text' : 'password'}
              className="w-full min-h-[44px] px-4 py-3.5 pr-12 bg-surface2 border border-border rounded-[14px] text-foreground text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-dim)] transition-all placeholder:text-muted"
              placeholder="Sua senha"
              value={pass}
              onChange={e => setPass(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-muted hover:text-foreground transition-colors"
              aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPass ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
            </button>
          </div>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-3.5 rounded-[14px] bg-grad text-bg font-syne font-bold text-base hover:-translate-y-0.5 hover:shadow-[0_6px_25px_var(--primary-glow)] transition-all disabled:opacity-60 disabled:cursor-wait"
        >
          {loading ? 'Entrando…' : 'Entrar →'}
        </button>

        <p className="text-center text-sm text-muted mt-4">
          Não tem conta?{' '}
          <a href="/cadastro" className="text-primary hover:underline">Criar grátis</a>
        </p>
        <p className="text-center text-sm text-muted mt-2">
          <a href="/esqueci-senha" className="text-primary/80 hover:underline">Esqueci minha senha</a>
        </p>
      </div>
    </main>
  )
}
