import { getSessionSafe } from '@/lib/auth'
import { isSuperadminEmail } from '@/lib/superadmin-allowlist'
import SuperadminSidebar from '@/components/superadmin/SuperadminSidebar'
import SuperadminMobileNav from '@/components/superadmin/SuperadminMobileNav'
import AuthSessionProvider from '@/components/AuthSessionProvider'
import BrandLogo from '@/components/BrandLogo'
import EditDemoStoreButton from '@/components/superadmin/EditDemoStoreButton'

export const dynamic = 'force-dynamic'

export default async function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionSafe()
  const showShell = session && isSuperadminEmail(session.user?.email)

  if (!showShell) {
    return <AuthSessionProvider>{children}</AuthSessionProvider>
  }

  return (
    <AuthSessionProvider>
      <div className="relative z-10 min-h-screen">
        <header className="sticky top-0 z-50 glass border-b border-border h-16 flex items-center justify-between px-4 sm:px-6 min-w-0">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <BrandLogo size="md" href="/" />
            <span className="hidden sm:block text-xs text-muted">|</span>
            <span className="hidden sm:block font-syne text-xs font-semibold text-muted uppercase tracking-widest">
              Painel do negócio
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <EditDemoStoreButton />
            <form action="/api/auth/signout-redirect" method="POST">
            <input type="hidden" name="callbackUrl" value="/superadmin/login" />
            <button
              type="submit"
              className="px-3 py-1.5 text-xs text-muted border border-border rounded-lg hover:border-warm hover:text-warm transition-all min-h-[44px]"
            >
              Sair
            </button>
            </form>
          </div>
        </header>

        <div className="flex min-w-0">
          <SuperadminSidebar />
          <main className="flex-1 min-w-0 p-4 sm:p-6 pb-[max(5rem,calc(64px+env(safe-area-inset-bottom,0px)))] md:pb-6 max-w-[1600px]">
            {children}
          </main>
        </div>
        <div className="md:hidden">
          <SuperadminMobileNav />
        </div>
      </div>
    </AuthSessionProvider>
  )
}
