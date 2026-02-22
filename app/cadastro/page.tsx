'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createBrowser } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Step = 1 | 2 | 3

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .substring(0, 40)
}

export default function CadastroPage() {
  const router  = useRouter()
  const supabase = createBrowser()

  const [step,     setStep]     = useState<Step>(1)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [finalSlug, setFinalSlug] = useState('')

  // Step 1
  const [name,  setName]  = useState('')
  const [email, setEmail] = useState('')
  const [pass,  setPass]  = useState('')

  // Step 2
  const [storeName, setStoreName] = useState('')
  const [wpp,       setWpp]       = useState('')
  const [slug,      setSlug]      = useState('sua-loja')

  async function handleStep1() {
    if (!name || !email || !pass) { setError('Preencha todos os campos.'); return }
    if (pass.length < 6)          { setError('Senha deve ter ao menos 6 caracteres.'); return }
    setError('')
    setStep(2)
  }

  async function handleStep2() {
    if (!storeName || !wpp) { setError('Preencha nome e WhatsApp.'); return }
    setLoading(true)
    setError('')
    try {
      const { error: signUpError } = await supabase.auth.signUp({ email, password: pass })
      if (signUpError) throw signUpError

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não encontrado após cadastro.')

      const generatedSlug = slugify(storeName)
      const { error: storeError } = await supabase.from('stores').insert({
        user_id:       user.id,
        slug:          generatedSlug,
        name:          storeName,
        whatsapp:      wpp.replace(/\D/g, ''),
        settings_json: {},
      })
      if (storeError) throw storeError

      setFinalSlug(generatedSlug)
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

  return (
    <main className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-surface border border-border rounded-[28px] p-10 shadow-[0_20px_60px_rgba(0,0,0,0.4)] animate-fade-up">

        <div className="font-syne font-extrabold text-3xl text-grad text-center mb-8">
          vend<span className="text-accent" style={{ WebkitTextFillColor: 'var(--accent)' }}>.</span>ai
        </div>

        {/* Step tracker */}
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

        {/* Step 1 */}
        {step === 1 && (
          <div>
            <h2 className="font-syne font-extrabold text-2xl mb-1">Crie sua conta</h2>
            <p className="text-sm text-muted mb-6">Rápido, gratuito e sem cartão de crédito</p>
            <div className="flex flex-col gap-3 mb-5">
              <input className="w-full px-4 py-3.5 bg-surface2 border border-border rounded-[14px] text-foreground text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-dim)] transition-all placeholder:text-muted" placeholder="👤 Seu nome completo" value={name} onChange={e => setName(e.target.value)} />
              <input type="email" className="w-full px-4 py-3.5 bg-surface2 border border-border rounded-[14px] text-foreground text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-dim)] transition-all placeholder:text-muted" placeholder="📧 Seu e-mail" value={email} onChange={e => setEmail(e.target.value)} />
              <input type="password" className="w-full px-4 py-3.5 bg-surface2 border border-border rounded-[14px] text-foreground text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-dim)] transition-all placeholder:text-muted" placeholder="🔒 Crie uma senha" value={pass} onChange={e => setPass(e.target.value)} />
            </div>
            <button onClick={handleStep1} className="w-full py-3.5 rounded-[14px] bg-grad text-bg font-syne font-bold text-base hover:-translate-y-0.5 hover:shadow-[0_6px_25px_var(--primary-glow)] transition-all">
              Continuar →
            </button>
            <p className="text-center text-sm text-muted mt-4">
              Já tem conta?{' '}
              <Link href="/admin" className="text-primary cursor-pointer hover:underline">Entrar</Link>
            </p>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div>
            <h2 className="font-syne font-extrabold text-2xl mb-1">Configure sua loja</h2>
            <p className="text-sm text-muted mb-6">Essas informações aparecem para seus clientes</p>
            <div className="flex flex-col gap-3 mb-5">
              <input className="w-full px-4 py-3.5 bg-surface2 border border-border rounded-[14px] text-foreground text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-dim)] transition-all placeholder:text-muted" placeholder="🏪 Nome da sua loja" value={storeName} onChange={e => { setStoreName(e.target.value); setSlug(slugify(e.target.value) || 'sua-loja') }} />
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-accent/10 border border-accent/30 rounded-[10px]">
                <span className="text-xs text-muted">Seu link será:</span>
                <span className="font-mono text-sm text-accent font-semibold">vend.ai/{slug}</span>
              </div>
              <input type="tel" className="w-full px-4 py-3.5 bg-surface2 border border-border rounded-[14px] text-foreground text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-dim)] transition-all placeholder:text-muted" placeholder="📱 WhatsApp (11) 99999-9999" value={wpp} onChange={e => setWpp(e.target.value)} />
            </div>
            <div className="flex gap-2.5">
              <button onClick={() => setStep(1)} className="px-5 py-3.5 rounded-[14px] border border-border text-muted text-sm hover:border-muted hover:text-foreground transition-all">
                ← Voltar
              </button>
              <button onClick={handleStep2} disabled={loading} className="flex-1 py-3.5 rounded-[14px] bg-grad text-bg font-syne font-bold text-base hover:-translate-y-0.5 hover:shadow-[0_6px_25px_var(--primary-glow)] transition-all disabled:opacity-60 disabled:cursor-wait">
                {loading ? 'Criando…' : 'Continuar →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Success */}
        {step === 3 && (
          <div>
            <div className="text-center text-6xl mb-4 animate-bounce2">🎉</div>
            <h2 className="font-syne font-extrabold text-2xl mb-1 text-center">Sua loja está no ar!</h2>
            <p className="text-sm text-muted text-center mb-5">Tudo pronto para começar a vender</p>
            <div className="flex items-center justify-between px-4 py-3 bg-accent/10 border border-accent/30 rounded-xl mb-5">
              <span className="font-mono text-sm text-accent font-semibold">vend.ai/{finalSlug}</span>
              <button onClick={() => navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL}/${finalSlug}`)} className="px-3 py-1.5 bg-accent rounded-lg text-bg text-xs font-bold">
                Copiar
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { icon: '📸', title: 'Cadastrar primeiro produto', sub: 'Tire uma foto e a IA faz o resto', href: '/admin/produtos/novo' },
                { icon: '📊', title: 'Ir para o painel',           sub: 'Ver pedidos e gerenciar sua loja', href: '/admin/dashboard' },
                { icon: '🛍️', title: 'Ver minha loja',             sub: 'Como seus clientes vão ver', href: `/${finalSlug}` },
              ].map(item => (
                <Link key={item.href} href={item.href} className="flex items-center gap-3 p-3.5 bg-surface2 border border-border rounded-[14px] hover:border-primary transition-all group">
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{item.title}</div>
                    <div className="text-xs text-muted">{item.sub}</div>
                  </div>
                  <span className="text-muted group-hover:text-foreground transition-colors">→</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
