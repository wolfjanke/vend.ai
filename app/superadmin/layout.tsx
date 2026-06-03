import { getSessionSafe } from '@/lib/auth'
import { isSuperadminEmail } from '@/lib/superadmin-allowlist'
import SuperadminSidebar from '@/components/superadmin/SuperadminSidebar'
import SuperadminMobileNav from '@/components/superadmin/SuperadminMobileNav'
import AuthSessionProvider from '@/components/AuthSessionProvider'

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
        <header className="sticky top-0 z-40 glass border-b border-border h-16 flex items-center justify-between px-4 sm:px-6 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-syne font-extrabold text-lg sm:text-xl truncate">
              vend<span className="text-[#FF6B6B]">.</span>ai
            </span>
            <span className="shrink-0 text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full bg-[#FF6B6B]/15 text-[#FF6B6B] border border-[#FF6B6B]/30">
              Wolf Hub Admin
            </span>
          </div>
          <form action="/api/auth/signout-redirect" method="POST" className="shrink-0">
            <input type="hidden" name="callbackUrl" value="/superadmin/login" />
            <button
              type="submit"
              className="text-sm text-muted hover:text-foreground min-h-[44px] px-3"
            >
              Sair
            </button>
          </form>
        </header>

        <div className="flex min-w-0">
          <SuperadminSidebar />
          <main className="flex-1 min-w-0 p-4 sm:p-6 pb-[max(5rem,calc(64px+env(safe-area-inset-bottom,0px)))] md:pb-6 max-w-[1600px]">
            {children}
          </main>
        </div>
        <SuperadminMobileNav />
      </div>
    </AuthSessionProvider>
  )
}
