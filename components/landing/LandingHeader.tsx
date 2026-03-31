'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function LandingHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="relative sticky top-0 z-50 glass border-b border-border min-h-16 flex items-center justify-between px-4 sm:px-6 animate-slide-down">
      <span className="font-syne font-extrabold text-lg sm:text-xl text-grad shrink-0">
        vend<span className="text-accent" style={{ WebkitTextFillColor: 'var(--accent)', opacity: 1 }}>.</span>ai
      </span>

      <nav className="hidden md:flex gap-6 text-sm font-medium text-muted">
        <a href="#como-funciona" className="hover:text-foreground transition-colors">Como funciona</a>
        <a href="#funcionalidades" className="hover:text-foreground transition-colors">Funcionalidades</a>
        <a href="#planos" className="hover:text-foreground transition-colors">Planos</a>
        <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
      </nav>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="hidden sm:flex gap-3 items-center">
          <a href="/admin" className="text-sm font-medium text-muted hover:text-foreground transition-colors px-2 py-2 min-h-[44px] flex items-center">
            Entrar
          </a>
          <a href="/cadastro" className="text-sm font-bold px-4 py-2 min-h-[44px] flex items-center rounded-xl bg-grad text-bg hover:opacity-90 transition-opacity">
            Criar loja grátis
          </a>
        </div>

        <button
          type="button"
          className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-border text-foreground"
          aria-expanded={open}
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setOpen(o => !o)}
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {open && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-surface border-b border-border shadow-lg flex flex-col p-4 gap-1 z-40">
          <a href="#como-funciona" className="py-3 px-2 min-h-[44px] flex items-center text-sm text-muted hover:text-foreground" onClick={() => setOpen(false)}>Como funciona</a>
          <a href="#funcionalidades" className="py-3 px-2 min-h-[44px] flex items-center text-sm text-muted hover:text-foreground" onClick={() => setOpen(false)}>Funcionalidades</a>
          <a href="#planos" className="py-3 px-2 min-h-[44px] flex items-center text-sm text-muted hover:text-foreground" onClick={() => setOpen(false)}>Planos</a>
          <a href="#faq" className="py-3 px-2 min-h-[44px] flex items-center text-sm text-muted hover:text-foreground" onClick={() => setOpen(false)}>FAQ</a>
          <hr className="border-border my-2" />
          <a href="/admin" className="py-3 px-2 min-h-[44px] flex items-center text-sm">Entrar</a>
          <Link href="/cadastro" className="py-3 px-4 min-h-[44px] flex items-center justify-center rounded-xl bg-grad text-bg font-bold text-sm" onClick={() => setOpen(false)}>
            Criar loja grátis
          </Link>
        </div>
      )}
    </header>
  )
}
