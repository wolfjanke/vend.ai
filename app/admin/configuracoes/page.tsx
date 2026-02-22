'use client'

import { useState, useEffect } from 'react'
import { createBrowser } from '@/lib/supabase'
import type { Store } from '@/types'

export default function ConfiguracoesPage() {
  const supabase = createBrowser()

  const [store,    setStore]    = useState<Store | null>(null)
  const [name,     setName]     = useState('')
  const [wpp,      setWpp]      = useState('')
  const [loading,  setLoading]  = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('stores').select('*').eq('user_id', user.id).single<Store>()
      if (data) {
        setStore(data)
        setName(data.name)
        setWpp(data.whatsapp)
      }
    }
    load()
  }, [supabase])

  async function handleSave() {
    if (!store) return
    if (!name.trim()) { setError('Nome da loja obrigatório.'); return }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.from('stores').update({ name: name.trim(), whatsapp: wpp.replace(/\D/g, '') }).eq('id', store.id)
    setLoading(false)
    if (err) { setError(err.message); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!store) return (
    <div className="flex items-center justify-center h-48 text-muted">
      <span className="animate-pulse">Carregando…</span>
    </div>
  )

  return (
    <div className="animate-fade-up max-w-lg">
      <div className="mb-6">
        <h1 className="font-syne font-extrabold text-2xl mb-1">Configurações</h1>
        <p className="text-sm text-muted">Gerencie os dados da sua loja</p>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-4">

        <div>
          <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Nome da loja</label>
          <input className="w-full px-4 py-3 bg-surface2 border border-border rounded-[12px] text-foreground text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-dim)] transition-all placeholder:text-muted" value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div>
          <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">WhatsApp</label>
          <input type="tel" className="w-full px-4 py-3 bg-surface2 border border-border rounded-[12px] text-foreground text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-dim)] transition-all placeholder:text-muted" value={wpp} onChange={e => setWpp(e.target.value)} placeholder="(11) 99999-9999" />
        </div>

        <div>
          <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Link da loja</label>
          <div className="flex items-center gap-2 px-4 py-3 bg-accent/10 border border-accent/30 rounded-[12px]">
            <span className="font-mono text-sm text-accent">{process.env.NEXT_PUBLIC_APP_URL}/{store.slug}</span>
            <button onClick={() => navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL}/${store.slug}`)} className="ml-auto text-xs px-2 py-1 bg-accent text-bg rounded-lg font-bold">
              Copiar
            </button>
          </div>
          <p className="text-xs text-muted mt-1.5">O slug não pode ser alterado após o cadastro.</p>
        </div>

        {error && <p className="text-sm text-warm">{error}</p>}

        <button onClick={handleSave} disabled={loading} className={`w-full py-3 rounded-[12px] font-syne font-bold text-sm transition-all ${saved ? 'bg-accent text-bg' : 'bg-primary text-white hover:shadow-[0_4px_20px_var(--primary-glow)]'} disabled:opacity-60`}>
          {loading ? 'Salvando…' : saved ? '✓ Salvo!' : 'Salvar alterações'}
        </button>
      </div>

      {/* Danger zone */}
      <div className="mt-6 bg-surface border border-warm/20 rounded-2xl p-6">
        <h3 className="font-syne font-bold text-sm text-warm mb-2">Zona de risco</h3>
        <p className="text-xs text-muted mb-4">Essas ações são irreversíveis.</p>
        <form action="/api/auth/logout" method="POST">
          <button type="submit" className="px-4 py-2.5 border border-warm/30 text-warm text-sm rounded-xl hover:bg-warm/10 transition-all">
            Sair da conta
          </button>
        </form>
      </div>
    </div>
  )
}
