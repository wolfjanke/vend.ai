import Link from 'next/link'
import { getSessionSafe } from '@/lib/auth'
import { sql } from '@/lib/db'

/** Obrigatório com getServerSession/cookies — sem isto o build pode pré-renderizar e `cookies()` lança em produção. */
export const dynamic = 'force-dynamic'

const navItems = [
  { href: '/admin/dashboard',     label: 'Dashboard', icon: '📊' },
  { href: '/admin/pedidos',       label: 'Pedidos',   icon: '🛍️' },
  { href: '/admin/produtos',      label: 'Produtos',  icon: '👗' },
  { href: '/admin/categorias',    label: 'Categorias', icon: '🏷️' },
  { href: '/admin/marketing',     label: 'Marketing', icon: '🎯' },
  { href: '/admin/configuracoes', label: 'Config',    icon: '⚙️' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    return await AdminLayoutInner({ children })
  } catch (e) {
    console.error('[admin/layout] fatal', e)
    return <>{children}</>
  }
}

async function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const session = await getSessionSafe()
  if (!session?.storeId) return <>{children}</>

  let store: { name: string; slug: string } | undefined
  try {
    const rows = await sql`SELECT name, slug FROM stores WHERE id = ${session.storeId} LIMIT 1`
    store = rows[0] as { name: string; slug: string } | undefined
  } catch (e) {
    console.error('[admin/layout] stores query:', e)
    return (
      <div className="relative z-10 min-h-screen p-4 md:p-6">
        <div className="max-w-lg mx-auto rounded-2xl border border-warm/30 bg-warm/10 px-4 py-3 text-sm text-warm break-words">
          Não foi possível carregar os dados da loja. Confira <code className="font-mono text-xs">DATABASE_URL</code> no
          ambiente de produção e os logs do servidor.
        </div>
        {children}
      </div>
    )
  }

  return (
    <div className="relative z-10 min-h-screen">
      {/* Top Header */}
      <header className="sticky top-0 z-50 glass border-b border-border h-16 flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <span className="font-syne font-extrabold text-lg text-grad">
            vend<span className="text-accent" style={{ WebkitTextFillColor: 'var(--accent)' }}>.</span>ai
          </span>
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
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 border border-accent/30 rounded-lg text-accent text-xs font-medium hover:bg-accent/20 transition-all"
            >
              🌐 Ver loja
            </a>
          )}
          <form action="/api/auth/signout-redirect" method="POST">
            <button type="submit" className="px-3 py-1.5 text-xs text-muted border border-border rounded-lg hover:border-warm hover:text-warm transition-all">
              Sair
            </button>
          </form>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex w-52 flex-col gap-1 p-4 border-r border-border min-h-[calc(100vh-64px)] sticky top-16">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-surface2 transition-all"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </aside>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-border flex">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center gap-1 py-3 text-xs text-muted hover:text-foreground transition-colors"
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Main */}
        <main className="flex-1 min-w-0 p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  )
}
