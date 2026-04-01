'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { z } from 'zod'
import MaskedInput from '@/components/ui/MaskedInput'
import { slugify } from '@/lib/masks'
import { registerSchema } from '@/lib/validations'
import type { AgeGroup, GenderFocus } from '@/types'

type Step = 1 | 2 | 3

function passwordStrength(pass: string): { score: number; label: string } {
  let score = 0
  if (pass.length >= 6) score++
  if (pass.length >= 10) score++
  if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++
  if (/\d/.test(pass)) score++
  if (/[^A-Za-z0-9]/.test(pass)) score++
  if (score <= 1) return { score: 1, label: 'Fraca' }
  if (score <= 3) return { score: 2, label: 'Média' }
  return { score: 3, label: 'Forte' }
}

const step1Schema = z.object({
  name:  z.string().min(1, 'Informe seu nome'),
  email: z.string().email('E-mail inválido'),
  pass:  z.string().min(6, 'Senha mínimo 6 caracteres'),
})

export default function CadastroPage() {
  const [step,      setStep]      = useState<Step>(1)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [finalSlug, setFinalSlug] = useState('')

  const [name,  setName]  = useState('')
  const [email, setEmail] = useState('')
  const [pass,  setPass]  = useState('')

  const [storeName, setStoreName] = useState('')
  const [wpp,       setWpp]       = useState('')
  const [slug,      setSlug]      = useState('sua-loja')
  const [genderFocus, setGenderFocus] = useState<GenderFocus>('feminine')
  const [ageGroup, setAgeGroup]       = useState<AgeGroup>('adult')

  const [fieldErr, setFieldErr] = useState<Record<string, string>>({})
  const strength = passwordStrength(pass)

  function handleStep1() {
    const r = step1Schema.safeParse({ name, email, pass })
    if (!r.success) {
      const fe: Record<string, string> = {}
      for (const iss of r.error.issues) {
        const k = String(iss.path[0])
        if (!fe[k]) fe[k] = iss.message
      }
      setFieldErr(fe)
      setError('Corrija os campos destacados.')
      return
    }
    setFieldErr({})
    setError('')
    setStep(2)
  }

  async function handleStep2() {
    const r = registerSchema.safeParse({ email, password: pass, storeName: storeName.trim(), whatsapp: wpp })
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
      const res = await fetch('/api/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email,
          password:  pass,
          storeName: storeName.trim(),
          whatsapp:  wpp,
          genderFocus,
          ageGroup,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao criar conta.')

      await signIn('credentials', { email, password: pass, redirect: false })

      setFinalSlug(data.slug)
      setStep(3)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao criar conta.')
    } finally {
      setLoading(false)
    }
  }

  const StepDot = ({ n }: { n: number }) => {
    const done   = step > n
    const active = step === n
    return (
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
        done   ? 'bg-accent/20 border border-accent text-accent' :
        active ? 'bg-primary text-white shadow-[0_0_15px_var(--primary-glow)]' :
                 'bg-surface2 border border-border text-muted'
      }`}>
        {done ? '✓' : n}
      </div>
    )
  }

  const baseUrl = typeof process.env.NEXT_PUBLIC_APP_URL === 'string' ? process.env.NEXT_PUBLIC_APP_URL : ''

  return (
    <main className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-surface border border-border rounded-[28px] p-6 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.4)] animate-fade-up">

        <div className="font-syne font-extrabold text-2xl sm:text-3xl text-grad text-center mb-8">
          vend<span className="text-accent" style={{ WebkitTextFillColor: 'var(--accent)' }}>.</span>ai
        </div>

        <div className="flex items-center justify-center gap-0 mb-9">
          <StepDot n={1} />
          <div className={`flex-1 max-w-[60px] h-px transition-all ${step > 1 ? 'bg-accent' : 'bg-border'}`} />
          <StepDot n={2} />
          <div className={`flex-1 max-w-[60px] h-px transition-all ${step > 2 ? 'bg-accent' : 'bg-border'}`} />
          <StepDot n={3} />
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-warm/10 border border-warm/30 rounded-xl text-warm text-sm">{error}</div>
        )}

        {step === 1 && (
          <div>
            <h2 className="font-syne font-extrabold text-xl sm:text-2xl mb-1">Crie sua conta</h2>
            <p className="text-sm text-muted mb-6">Rápido, gratuito e sem cartão de crédito</p>
            <div className="flex flex-col gap-3 mb-5">
              <div>
                <input
                  className={`w-full min-h-[44px] px-4 py-3.5 bg-surface2 border rounded-[14px] text-foreground text-sm outline-none transition-all placeholder:text-muted ${fieldErr.name ? 'border-warm' : 'border-border focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-dim)]'}`}
                  placeholder="👤 Seu nome completo"
                  value={name}
                  onChange={e => { setName(e.target.value); setFieldErr(p => { const n = { ...p }; delete n.name; return n }) }}
                />
                {fieldErr.name && <p className="text-xs text-warm mt-1">{fieldErr.name}</p>}
              </div>
              <div>
                <input
                  type="email"
                  className={`w-full min-h-[44px] px-4 py-3.5 bg-surface2 border rounded-[14px] text-foreground text-sm outline-none transition-all placeholder:text-muted ${fieldErr.email ? 'border-warm' : 'border-border focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-dim)]'}`}
                  placeholder="📧 Seu e-mail"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setFieldErr(p => { const n = { ...p }; delete n.email; return n }) }}
                />
                {fieldErr.email && <p className="text-xs text-warm mt-1">{fieldErr.email}</p>}
              </div>
              <div>
                <input
                  type="password"
                  className={`w-full min-h-[44px] px-4 py-3.5 bg-surface2 border rounded-[14px] text-foreground text-sm outline-none transition-all placeholder:text-muted ${fieldErr.pass ? 'border-warm' : 'border-border focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-dim)]'}`}
                  placeholder="🔒 Crie uma senha"
                  value={pass}
                  onChange={e => { setPass(e.target.value); setFieldErr(p => { const n = { ...p }; delete n.pass; return n }) }}
                  onKeyDown={e => e.key === 'Enter' && handleStep1()}
                />
                {fieldErr.pass && <p className="text-xs text-warm mt-1">{fieldErr.pass}</p>}
                {!fieldErr.pass && pass.length > 0 && (
                  <div className="mt-2">
                    <div className="h-1.5 w-full rounded-full bg-surface2 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          strength.score === 1 ? 'bg-warm w-1/3' : strength.score === 2 ? 'bg-yellow-400 w-2/3' : 'bg-accent w-full'
                        }`}
                      />
                    </div>
                    <p className="text-[11px] text-muted mt-1">Força da senha: {strength.label}</p>
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleStep1}
              className="w-full min-h-[48px] py-3.5 rounded-[14px] bg-grad text-bg font-syne font-bold text-base hover:-translate-y-0.5 hover:shadow-[0_6px_25px_var(--primary-glow)] transition-all"
            >
              Continuar →
            </button>
            <p className="text-center text-sm text-muted mt-4">
              Já tem conta?{' '}
              <Link href="/admin" className="text-primary cursor-pointer hover:underline">Entrar</Link>
            </p>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="font-syne font-extrabold text-xl sm:text-2xl mb-1">Configure sua loja</h2>
            <p className="text-sm text-muted mb-6">Essas informações aparecem para seus clientes</p>
            <div className="flex flex-col gap-3 mb-5">
              <div>
                <input
                  className={`w-full min-h-[44px] px-4 py-3.5 bg-surface2 border rounded-[14px] text-foreground text-sm outline-none transition-all placeholder:text-muted ${fieldErr.storeName ? 'border-warm' : 'border-border focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-dim)]'}`}
                  placeholder="🏪 Nome da sua loja"
                  value={storeName}
                  onChange={e => { setStoreName(e.target.value); setSlug(slugify(e.target.value) || 'sua-loja'); setFieldErr(p => { const n = { ...p }; delete n.storeName; return n }) }}
                />
                {fieldErr.storeName && <p className="text-xs text-warm mt-1">{fieldErr.storeName}</p>}
              </div>
              <div className="flex items-start gap-2 px-3.5 py-2.5 bg-accent/10 border border-accent/30 rounded-[10px] min-w-0">
                <span className="text-xs text-muted shrink-0 pt-0.5">Seu link:</span>
                <span className="font-mono text-xs sm:text-sm text-accent font-semibold break-all min-w-0">vend.ai/{slug}</span>
              </div>
              <div>
                <MaskedInput
                  mask="phone"
                  className={`w-full min-h-[44px] px-4 py-3.5 bg-surface2 border rounded-[14px] text-foreground text-sm outline-none transition-all placeholder:text-muted ${fieldErr.whatsapp ? 'border-warm' : 'border-border focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-dim)]'}`}
                  placeholder="📱 WhatsApp (11) 99999-9999"
                  value={wpp}
                  onChange={v => { setWpp(v); setFieldErr(p => { const n = { ...p }; delete n.whatsapp; return n }) }}
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
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-3.5 min-h-[48px] rounded-[14px] border border-border text-muted text-sm hover:border-muted hover:text-foreground transition-all"
                >
                  ← Voltar
                </button>
                <button
                  type="button"
                  onClick={handleStep2}
                  disabled={loading}
                  className="flex-1 py-3.5 min-h-[48px] rounded-[14px] bg-grad text-bg font-syne font-bold text-base hover:-translate-y-0.5 hover:shadow-[0_6px_25px_var(--primary-glow)] transition-all disabled:opacity-60 disabled:cursor-wait"
                >
                  {loading ? 'Criando…' : 'Continuar →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="text-center text-6xl mb-4 animate-bounce2">🎉</div>
            <h2 className="font-syne font-extrabold text-xl sm:text-2xl mb-1 text-center">Sua loja está no ar!</h2>
            <p className="text-sm text-muted text-center mb-5">Tudo pronto para começar a vender</p>
            <div className="flex flex-col gap-2 px-4 py-3 bg-accent/10 border border-accent/30 rounded-xl mb-5 min-w-0 overflow-hidden">
              <span className="font-mono text-xs sm:text-sm text-accent font-semibold break-all text-center">{baseUrl ? `${baseUrl}/${finalSlug}` : `vend.ai/${finalSlug}`}</span>
              <button
                type="button"
                onClick={() => { if (baseUrl) void navigator.clipboard.writeText(`${baseUrl}/${finalSlug}`) }}
                className="w-full min-h-[44px] py-2 bg-accent rounded-lg text-bg text-xs font-bold"
              >
                Copiar link
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { icon: '📸', title: 'Cadastrar primeiro produto', sub: 'Tire uma foto e a IA faz o resto',    href: '/admin/produtos/novo' },
                { icon: '📊', title: 'Ir para o painel',           sub: 'Ver pedidos e gerenciar sua loja',    href: '/admin/dashboard' },
                { icon: '🛍️', title: 'Ver minha loja',             sub: 'Como seus clientes vão ver',          href: `/${finalSlug}` },
              ].map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 p-3.5 bg-surface2 border border-border rounded-[14px] hover:border-primary transition-all group min-h-[44px]"
                >
                  <span className="text-xl shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{item.title}</div>
                    <div className="text-xs text-muted break-words">{item.sub}</div>
                  </div>
                  <span className="text-muted group-hover:text-foreground transition-colors shrink-0">→</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
