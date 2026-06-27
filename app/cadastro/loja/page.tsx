'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { z } from 'zod'
import { stripEmojis } from '@/lib/strip-emoji'
import MaskedInput from '@/components/ui/MaskedInput'
import { slugify } from '@/lib/masks'
import { completeSignupSchema } from '@/lib/validations'
import type { AgeGroup, GenderFocus } from '@/types'
import AuthSessionProvider from '@/components/AuthSessionProvider'
import BrandLogo from '@/components/BrandLogo'
import { storePublicPath } from '@/lib/brand'

function CadastroLojaPage() {
  const router = useRouter()
  const { data: session, status, update } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [ownerName, setOwnerName] = useState('')
  const [storeName, setStoreName] = useState('')
  const [wpp, setWpp] = useState('')
  const [slug, setSlug] = useState('sua-loja')
  const [genderFocus, setGenderFocus] = useState<GenderFocus>('feminine')
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('adult')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({})

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/cadastro')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.storeId) {
      router.replace('/admin/dashboard')
    }
  }, [session?.storeId, router])

  useEffect(() => {
    const name = session?.user?.name
    if (name && !ownerName) setOwnerName(name)
  }, [session?.user?.name, ownerName])

  async function handleSubmit() {
    if (!termsAccepted) {
      setFieldErr({ termsAccepted: 'Aceite os termos de uso para continuar' })
      setError('Aceite os termos de uso para continuar.')
      return
    }

    const r = completeSignupSchema.safeParse({
      ownerName: ownerName.trim(),
      storeName: storeName.trim(),
      whatsapp: wpp,
      termsAccepted: true as const,
      genderFocus,
      ageGroup,
    })
    if (!r.success) {
      const fe: Record<string, string> = {}
      for (const iss of r.error.issues) {
        const k = String(iss.path[0])
        if (!fe[k]) fe[k] = iss.message
      }
      setFieldErr(fe)
      setError(r.error.issues[0]?.message ?? 'Verifique os dados.')
      return
    }

    setLoading(true)
    setError('')
    setFieldErr({})
    try {
      const res = await fetch('/api/auth/complete-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerName: ownerName.trim(),
          storeName: storeName.trim(),
          whatsapp: wpp,
          genderFocus,
          ageGroup,
          termsAccepted: true,
          theme_name: 'default',
          theme_onboarding_done: false,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao criar loja.')

      await update({ refreshStore: true })
      window.location.assign('/admin/dashboard')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao criar loja.')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <main className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <p className="text-sm text-muted">Carregando…</p>
      </main>
    )
  }

  return (
    <main className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-surface border border-border rounded-[28px] p-6 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.4)] animate-fade-up">
        <div className="flex justify-center mb-8">
          <BrandLogo size="xl" />
        </div>

        <h2 className="font-syne font-extrabold text-xl sm:text-2xl mb-1">Configure sua loja</h2>
        <p className="text-sm text-muted mb-2 break-words">
          Conta Google: <span className="text-foreground">{session?.user?.email}</span>
        </p>
        <p className="text-sm text-muted mb-6">Falta só estes dados para abrir seu painel</p>

        {error && (
          <div className="mb-4 px-4 py-3 bg-warm/10 border border-warm/30 rounded-xl text-warm text-sm break-words">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 mb-5">
          <div>
            <input
              className={`w-full min-h-[44px] px-4 py-3.5 bg-surface2 border rounded-[14px] text-foreground text-sm outline-none transition-all placeholder:text-muted ${fieldErr.ownerName ? 'border-warm' : 'border-border focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-dim)]'}`}
              placeholder="Seu nome completo"
              value={ownerName}
              onChange={e => {
                setOwnerName(stripEmojis(e.target.value))
                setFieldErr(p => { const n = { ...p }; delete n.ownerName; return n })
              }}
            />
            {fieldErr.ownerName && <p className="text-xs text-warm mt-1">{fieldErr.ownerName}</p>}
          </div>
          <div>
            <input
              className={`w-full min-h-[44px] px-4 py-3.5 bg-surface2 border rounded-[14px] text-foreground text-sm outline-none transition-all placeholder:text-muted ${fieldErr.storeName ? 'border-warm' : 'border-border focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-dim)]'}`}
              placeholder="Nome da sua loja"
              value={storeName}
              onChange={e => {
                setStoreName(stripEmojis(e.target.value))
                setSlug(slugify(e.target.value) || 'sua-loja')
                setFieldErr(p => { const n = { ...p }; delete n.storeName; return n })
              }}
            />
            {fieldErr.storeName && <p className="text-xs text-warm mt-1">{fieldErr.storeName}</p>}
          </div>
          <div className="flex flex-col gap-1 px-3.5 py-2.5 bg-accent/10 border border-accent/30 rounded-[10px] min-w-0">
            <div className="flex items-start gap-2 min-w-0">
              <span className="text-xs text-muted shrink-0 pt-0.5">Seu link:</span>
              <span className="font-mono text-xs sm:text-sm text-accent font-semibold break-all min-w-0">
                {storePublicPath(slug)}
              </span>
            </div>
          </div>
          <div>
            <MaskedInput
              mask="phone"
              className={`w-full min-h-[44px] px-4 py-3.5 bg-surface2 border rounded-[14px] text-foreground text-sm outline-none transition-all placeholder:text-muted ${fieldErr.whatsapp ? 'border-warm' : 'border-border focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-dim)]'}`}
              placeholder="WhatsApp (11) 99999-9999"
              value={wpp}
              onChange={v => {
                setWpp(v)
                setFieldErr(p => { const n = { ...p }; delete n.whatsapp; return n })
              }}
              autoComplete="tel"
            />
            {fieldErr.whatsapp && <p className="text-xs text-warm mt-1">{fieldErr.whatsapp}</p>}
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Público principal</label>
            <select
              className="w-full min-h-[44px] px-4 py-3 bg-surface2 border border-border rounded-[14px] text-foreground text-sm outline-none focus:border-primary"
              value={genderFocus}
              onChange={e => setGenderFocus(e.target.value as GenderFocus)}
            >
              <option value="feminine">Feminino</option>
              <option value="masculine">Masculino</option>
              <option value="unisex">Unissex</option>
              <option value="mixed">Misto (feminino e masculino)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Faixa etária</label>
            <select
              className="w-full min-h-[44px] px-4 py-3 bg-surface2 border border-border rounded-[14px] text-foreground text-sm outline-none focus:border-primary"
              value={ageGroup}
              onChange={e => setAgeGroup(e.target.value as AgeGroup)}
            >
              <option value="adult">Adulto</option>
              <option value="kids">Infantil</option>
              <option value="all">Todas as idades</option>
            </select>
          </div>
          <label className={`flex items-start gap-3 min-h-[44px] cursor-pointer ${fieldErr.termsAccepted ? 'text-warm' : 'text-muted'}`}>
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={e => {
                setTermsAccepted(e.target.checked)
                setFieldErr(p => { const n = { ...p }; delete n.termsAccepted; return n })
              }}
              className="mt-1 shrink-0 w-5 h-5 rounded border-border accent-primary"
            />
            <span className="text-xs leading-relaxed break-words">
              Li e aceito os{' '}
              <Link href="/termos" target="_blank" className="text-primary underline underline-offset-2">
                Termos de Uso
              </Link>{' '}
              e a{' '}
              <Link href="/privacidade" target="_blank" className="text-primary underline underline-offset-2">
                Política de Privacidade
              </Link>
              .
            </span>
          </label>
        </div>

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={loading}
          className="w-full min-h-[48px] py-3.5 rounded-[14px] bg-grad text-bg font-syne font-bold text-base hover:-translate-y-0.5 hover:shadow-[0_6px_25px_var(--primary-glow)] transition-all disabled:opacity-60 disabled:cursor-wait"
        >
          {loading ? 'Criando loja…' : 'Abrir meu painel →'}
        </button>
      </div>
    </main>
  )
}

export default function CadastroLojaPageWithAuth() {
  return (
    <AuthSessionProvider>
      <CadastroLojaPage />
    </AuthSessionProvider>
  )
}
