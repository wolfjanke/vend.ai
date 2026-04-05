import { Globe } from 'lucide-react'
import { getSessionSafe } from '@/lib/auth'
import { sql } from '@/lib/db'
import AdminSidebar from '@/components/admin/AdminSidebar'

/** Obrigatório com getServerSession/cookies — sem isto o build pode pré-renderizar e `cookies()` lança em produção. */
export const dynamic = 'force-dynamic'

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

  let store: { name: string; slug: string; plan?: string } | undefined
  let newOrdersCount = 0
  try {
    const rows = await sql`SELECT name, slug, plan FROM stores WHERE id = ${session.storeId} LIMIT 1`
    store = rows[0] as { name: string; slug: string; plan?: string } | undefined
    const countRows = await sql`
      SELECT COUNT(*)::int as c FROM orders
      WHERE store_id = ${session.storeId} AND status = 'NOVO'
    `
    newOrdersCount = Number(countRows[0]?.c ?? 0)
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
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 border border-accent/30 rounded-lg text-accent text-xs font-medium hover:bg-accent/20 transition-all"
            >
              <Globe size={14} aria-hidden />
              Ver loja
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
        <AdminSidebar newOrdersCount={newOrdersCount} plan={(store?.plan ?? 'free') as import('@/types').PlanSlug} />

        {/* Main */}
        <main className="flex-1 min-w-0 p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  )
}
