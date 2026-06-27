'use client'

import { useState } from 'react'
import { loginWithCredentials } from '@/lib/client-login'
import BrandLogo from '@/components/BrandLogo'
import { superadminBtnPrimary } from '@/lib/superadmin-ui'

export default function SuperadminLoginPage() {
  const [email,   setEmail]   = useState('')
  const [pass,    setPass]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleLogin() {
    if (!email || !pass) {
      setError('Preencha e-mail e senha.')
      return
    }
    setLoading(true)
    setError('')

    const res = await loginWithCredentials(email, pass)

    if (!res.ok) {
      setError(res.error)
      setLoading(false)
      return
    }

    const me = await fetch('/api/superadmin/me')
    if (!me.ok) {
      await fetch('/api/auth/revoke-session', { method: 'POST' })
      setError('Este e-mail não tem acesso ao painel.')
      setLoading(false)
      return
    }

    window.location.assign('/superadmin/dashboard')
  }

  return (
    <main className="relative z-10 min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-surface border border-border rounded-[28px] p-8 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.4)] animate-fade-up">
        <div className="flex justify-center mb-2">
          <BrandLogo size="xl" />
        </div>
        <p className="text-center text-sm text-warm font-medium mb-6">Painel interno — vendai.club</p>

        <h2 className="font-syne font-bold text-lg sm:text-xl mb-1">Painel do negócio</h2>
        <p className="text-sm text-muted mb-6">Acesso restrito ao dono do SaaS</p>

        {error && (
          <div className="mb-4 px-4 py-3 bg-warm/10 border border-warm/30 rounded-xl text-warm text-sm break-words">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 mb-5">
          <input
            type="email"
            className="w-full px-4 py-3.5 min-h-[44px] bg-surface2 border border-border rounded-[14px] text-foreground text-sm outline-none focus:border-warm transition-all placeholder:text-muted"
            placeholder="E-mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
          <input
            type="password"
            className="w-full px-4 py-3.5 min-h-[44px] bg-surface2 border border-border rounded-[14px] text-foreground text-sm outline-none focus:border-warm transition-all placeholder:text-muted"
            placeholder="Senha"
            value={pass}
            onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
        </div>

        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          className={`w-full py-3.5 font-syne font-bold text-base ${superadminBtnPrimary}`}
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </div>
    </main>
  )
}
