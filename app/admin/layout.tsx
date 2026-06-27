import { Globe } from 'lucide-react'
import { redirect } from 'next/navigation'
import { getSessionSafe } from '@/lib/auth'
import { isAdminEmailVerified } from '@/lib/authenticate-admin'
import { getAdminShellData } from '@/lib/admin-layout-data'
import AdminSidebar from '@/components/admin/AdminSidebar'
import MobileNav from '@/components/admin/MobileNav'
import ImpersonationBanner from '@/components/admin/ImpersonationBanner'
import AuthSessionProvider from '@/components/AuthSessionProvider'
import BrandLogo from '@/components/BrandLogo'

/** Obrigatório com getServerSession/cookies — sem isto o build pode pré-renderizar e `cookies()` lança em produção. */
export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    return await AdminLayoutInner({ children })
  } catch (e) {
    console.error('[admin/layout] fatal', e)
    return <AuthSessionProvider>{children}</AuthSessionProvider>
  }
}

async function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const session = await getSessionSafe()
  const sessionExpired = session && new Date(session.expires) <= new Date()
  if (!session?.storeId || sessionExpired) {
    return <AuthSessionProvider>{children}</AuthSessionProvider>
  }

  if (session.user?.id && session.user.email) {
    const verified = await isAdminEmailVerified(session.user.id)
    if (!verified) {
      redirect(`/verificar-email/aguardando?email=${encodeURIComponent(session.user.email)}`)
    }
  }

  let store: { name: string; slug: string; plan?: string; isDemo?: boolean } | undefined
  let newOrdersCount = 0
  try {
    const shell = await getAdminShellData(session.storeId)
    store = shell.store
    newOrdersCount = shell.newOrdersCount
  } catch (e) {
    console.error('[admin/layout] stores query:', e)
    return (
      <div className="relative z-10 min-h-screen p-4 md:p-6">
        <div className="max-w-lg mx-auto rounded-2xl border border-warm/30 bg-warm/10 px-4 py-3 text-sm text-warm break-words">
          Não foi possível carregar os dados da loja. Confira <code className="font-mono text-xs">DATABASE_URL</code> no
          ambiente de produção e os logs do servidor.
        </div>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </div>
    )
  }

  return (
    <AuthSessionProvider>
    <div className="relative z-10 min-h-screen">
      {/* Top Header */}
      <header className="sticky top-0 z-50 glass border-b border-border h-16 flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <BrandLogo size="md" href="/" />
          <span className="hidden sm:block text-xs text-muted">|</span>
          <span className="hidden sm:block font-syne text-xs font-semibold text-muted uppercase tracking-widest">
            {store?.name ?? 'Painel'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {store?.slug && (
            <a
              href={`/${store.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 min-h-[44px] sm:min-h-0 bg-accent/10 border border-accent/30 rounded-lg text-accent text-xs font-medium hover:bg-accent/20 transition-all"
              aria-label="Ver loja pública"
            >
              <Globe size={14} className="shrink-0" aria-hidden />
              <span className="hidden sm:inline">Ver loja</span>
            </a>
          )}
          <form action="/api/auth/signout-redirect" method="POST">
            <input type="hidden" name="callbackUrl" value="/admin" />
            <button type="submit" className="px-3 py-1.5 text-xs text-muted border border-border rounded-lg hover:border-warm hover:text-warm transition-all">
              Sair
            </button>
          </form>
        </div>
      </header>
      <ImpersonationBanner />

      <div className="flex">
        <AdminSidebar newOrdersCount={newOrdersCount} plan={(store?.plan ?? 'free') as import('@/types').PlanSlug} isDemo={store?.isDemo} />

        {/* Main */}
        <main className="flex-1 min-w-0 p-4 md:p-6 xl:p-8 pb-[max(5rem,calc(64px+env(safe-area-inset-bottom,0px)))] md:pb-6">
          <div className="w-full min-w-0">
            {children}
          </div>
        </main>
      </div>

      <div className="md:hidden">
        <MobileNav
          newOrdersCount={newOrdersCount}
          plan={(store?.plan ?? 'free') as import('@/types').PlanSlug}
          isDemo={store?.isDemo}
        />
      </div>
    </div>
    </AuthSessionProvider>
  )
}
