'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Camera, LayoutDashboard, Store, CheckCircle2 } from 'lucide-react'
import BrandLogo from '@/components/BrandLogo'
import { storePublicPath } from '@/lib/brand'

function SucessoContent() {
  const searchParams = useSearchParams()
  const slug = searchParams.get('slug') ?? ''
  const baseUrl = typeof process.env.NEXT_PUBLIC_APP_URL === 'string' ? process.env.NEXT_PUBLIC_APP_URL : ''
  const publicUrl = slug ? (baseUrl ? `${baseUrl.replace(/\/$/, '')}/${slug}` : storePublicPath(slug)) : ''

  return (
    <>
      <CheckCircle2 size={56} className="mx-auto text-accent mb-4 animate-bounce2" aria-hidden />
      <h1 className="font-syne font-extrabold text-xl sm:text-2xl mb-1 text-center">E-mail confirmado!</h1>
      <p className="text-sm text-muted text-center mb-5">Sua loja está pronta para começar</p>

      {slug && (
        <div className="flex flex-col gap-2 px-4 py-3 bg-accent/10 border border-accent/30 rounded-xl mb-5 min-w-0 overflow-hidden">
          <span className="font-mono text-xs sm:text-sm text-accent font-semibold break-all text-center">
            {publicUrl}
          </span>
          {baseUrl && (
            <button
              type="button"
              onClick={() => { void navigator.clipboard.writeText(publicUrl) }}
              className="w-full min-h-[44px] py-2 bg-accent rounded-lg text-bg text-xs font-bold"
            >
              Copiar link
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {[
          { Icon: Camera, title: 'Cadastrar primeiro produto', sub: 'Foto, preço e tamanhos', href: '/admin/produtos/novo?guia=1' },
          { Icon: Store, title: 'Configurar minha loja', sub: 'Nome, logo e WhatsApp', href: '/admin/loja?secao=identidade' },
          { Icon: LayoutDashboard, title: 'Ir para o painel', sub: 'Ver pedidos e métricas', href: '/admin/dashboard' },
          ...(slug ? [{ Icon: Store, title: 'Ver minha loja', sub: 'Como seus clientes vão ver', href: `/${slug}` }] : []),
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 p-3.5 bg-surface2 border border-border rounded-[14px] hover:border-primary transition-all group min-h-[44px]"
          >
            <item.Icon size={22} className="text-primary shrink-0" aria-hidden />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">{item.title}</div>
              <div className="text-xs text-muted break-words">{item.sub}</div>
            </div>
            <span className="text-muted group-hover:text-foreground transition-colors shrink-0">→</span>
          </Link>
        ))}
      </div>
    </>
  )
}

export default function VerificarEmailSucessoPage() {
  return (
    <main className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-surface border border-border rounded-[28px] p-6 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.4)] animate-fade-up">
        <div className="flex justify-center mb-6">
          <BrandLogo size="xl" />
        </div>
        <Suspense fallback={<p className="text-center text-muted text-sm">Carregando…</p>}>
          <SucessoContent />
        </Suspense>
      </div>
    </main>
  )
}
