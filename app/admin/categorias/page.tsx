import { redirect } from 'next/navigation'
import { getSessionSafe } from '@/lib/auth'
import { sql } from '@/lib/db'
import type { Store } from '@/types'
import CategoriesManager from './CategoriesManager'

export default async function CategoriasPage() {
  const session = await getSessionSafe()
  if (!session) redirect('/admin')

  const storeRows = await sql`SELECT * FROM stores WHERE id = ${session.storeId} LIMIT 1`
  const store = storeRows[0] as Store | undefined
  if (!store) redirect('/cadastro')

  const countRows = await sql`
    SELECT category, COUNT(*)::int as total
    FROM products
    WHERE store_id = ${session.storeId}
    GROUP BY category
  `

  const counts: Record<string, number> = {}
  for (const row of countRows as { category: string; total: number }[]) {
    counts[row.category] = row.total
  }

  return (
    <div className="animate-fade-up max-w-2xl">
      <div className="mb-6">
        <h1 className="font-syne font-extrabold text-xl sm:text-2xl mb-1">Categorias</h1>
        <p className="text-sm text-muted break-words">
          Categorias padrão do sistema e categorias extras da sua loja (perfumes, acessórios etc.). Os
          filtros da vitrine mostram só o que tiver produto ativo.
        </p>
      </div>
      <CategoriesManager
        customCategories={store.settings_json?.customCategories ?? []}
        productCounts={counts}
      />
    </div>
  )
}
