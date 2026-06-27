'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import BrandLogo from '@/components/BrandLogo'
import {
  clearAuthTokenFromBrowserUrl,
  readAuthTokenFromBrowserUrl,
} from '@/lib/auth-token-url'

function VerificarToken() {
  const router = useRouter()
  const [tokenReady, setTokenReady] = useState(false)
  const [token, setToken] = useState('')

  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    const value = readAuthTokenFromBrowserUrl()
    setToken(value)
    setTokenReady(true)
    if (value) clearAuthTokenFromBrowserUrl()
  }, [])

  useEffect(() => {
    if (!tokenReady) return
    if (!token) {
      setStatus('error')
      setError('Link inválido.')
      return
    }

    let cancelled = false

    async function verify() {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error ?? 'Link inválido ou expirado')
        if (cancelled) return
        const slug = typeof data.slug === 'string' ? data.slug : ''
        router.replace(slug ? `/verificar-email/sucesso?slug=${encodeURIComponent(slug)}` : '/admin/dashboard')
      } catch (err) {
        if (cancelled) return
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Erro ao verificar')
      }
    }

    void verify()
    return () => { cancelled = true }
  }, [token, tokenReady, router])

  if (!tokenReady || status === 'loading') {
    return (
      <p className="text-sm text-muted text-center">
        Confirmando seu e-mail…
      </p>
    )
  }

  return (
    <div className="text-center">
      <p className="text-sm text-warm mb-4 break-words">{error}</p>
      <Link
        href="/verificar-email/aguardando"
        className="text-sm text-primary hover:underline"
      >
        Solicitar novo link →
      </Link>
    </div>
  )
}

export default function VerificarEmailPage() {
  return (
    <main className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-surface border border-border rounded-[28px] p-6 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.4)] animate-fade-up">
        <div className="flex justify-center mb-6">
          <BrandLogo size="xl" />
        </div>
        <h1 className="font-syne font-bold text-xl sm:text-2xl mb-4 text-center">Verificação de e-mail</h1>
        <Suspense fallback={<p className="text-center text-muted text-sm">Carregando…</p>}>
          <VerificarToken />
        </Suspense>
      </div>
    </main>
  )
}
