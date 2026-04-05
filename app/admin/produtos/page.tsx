import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Shirt } from 'lucide-react'
import { getSessionSafe } from '@/lib/auth'
import { sql } from '@/lib/db'
import type { Product, ProductVariant, StoreSettings, PlanSlug } from '@/types'
import { getCategoryDisplayLabel, PLAN_PRODUCT_LIMITS } from '@/types'
import ToggleActiveButton from './ToggleActiveButton'
import DeleteProductButton from './DeleteProductButton'
import Pagination from '@/components/ui/Pagination'

const PAGE_SIZE = 24

type ActiveFilter = 'all' | 'active' | 'inactive'
type SortKey = 'newest' | 'oldest' | 'name' | 'price'

function parseActive(v: string | undefined): ActiveFilter {
  if (v === 'active') return 'active'
  if (v === 'inactive') return 'inactive'
  return 'all'
}

function parseSort(v: string | undefined): SortKey {
  if (v === 'oldest' || v === 'name' || v === 'price') return v
  return 'newest'
}

function variantTotalStock(v: ProductVariant): number {
  if (!v.stock || typeof v.stock !== 'object') return 0
  return Object.values(v.stock).reduce((a, b) => a + (Number(b) || 0), 0)
}

function productOutOfStock(p: Product): boolean {
  if (!p.variants_json?.length) return true
  return p.variants_json.every(v => variantTotalStock(v) <= 0)
}

interface Props {
  searchParams: Promise<{ page?: string; search?: string; active?: string; sort?: string }>
}

export default async function ProdutosPage({ searchParams }: Props) {
  const session = await getSessionSafe()
  if (!session) redirect('/admin')

  const params = await searchParams
  const storeId = session.storeId
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)
  const offset = (page - 1) * PAGE_SIZE
  const searchTerm = params.search?.trim() ?? ''
  const activeFilter = parseActive(params.active)
  const sort = parseSort(params.sort)

  const hasSearch = searchTerm.length > 0
  const sp = hasSearch ? `%${searchTerm}%` : ''
  const all = activeFilter === 'all'
  const act = activeFilter === 'active'
  const inact = activeFilter === 'inactive'

  const countRows = await sql`
    SELECT COUNT(*)::int as c FROM products
    WHERE store_id = ${storeId}
    AND (${!hasSearch} OR name ILIKE ${sp})
    AND (
      ${all} OR (active = true AND ${act}) OR (active = false AND ${inact})
    )
  `
  const total = Number(countRows[0]?.c ?? 0)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  let products: unknown[]
  if (sort === 'oldest') {
    products = await sql`
      SELECT * FROM products
      WHERE store_id = ${storeId}
      AND (${!hasSearch} OR name ILIKE ${sp})
      AND (
        ${all} OR (active = true AND ${act}) OR (active = false AND ${inact})
      )
      ORDER BY created_at ASC
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `
  } else if (sort === 'name') {
    products = await sql`
      SELECT * FROM products
      WHERE store_id = ${storeId}
      AND (${!hasSearch} OR name ILIKE ${sp})
      AND (
        ${all} OR (active = true AND ${act}) OR (active = false AND ${inact})
      )
      ORDER BY name ASC
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `
  } else if (sort === 'price') {
    products = await sql`
      SELECT * FROM products
      WHERE store_id = ${storeId}
      AND (${!hasSearch} OR name ILIKE ${sp})
      AND (
        ${all} OR (active = true AND ${act}) OR (active = false AND ${inact})
      )
      ORDER BY price ASC
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `
  } else {
    products = await sql`
      SELECT * FROM products
      WHERE store_id = ${storeId}
      AND (${!hasSearch} OR name ILIKE ${sp})
      AND (
        ${all} OR (active = true AND ${act}) OR (active = false AND ${inact})
      )
      ORDER BY created_at DESC
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `
  }

  const settingsRows = await sql`SELECT settings_json, plan FROM stores WHERE id = ${storeId} LIMIT 1`
  const settings = (settingsRows[0]?.settings_json as StoreSettings | null) ?? {}
  const customCategories = settings.customCategories ?? []
  const storePlan = (settingsRows[0]?.plan ?? 'free') as PlanSlug
  const productLimit = PLAN_PRODUCT_LIMITS[storePlan]
  const totalProducts = await sql`SELECT COUNT(*)::int as c FROM products WHERE store_id = ${storeId}`
  const totalProductCount = Number(totalProducts[0]?.c ?? 0)

  const getCategoryLabel = (val: string) => getCategoryDisplayLabel(val, customCategories)

  const basePath = '/admin/produtos'
  const q = new URLSearchParams()
  if (hasSearch) q.set('search', searchTerm)
  if (activeFilter !== 'all') q.set('active', activeFilter)
  if (sort !== 'newest') q.set('sort', sort)
  const paginationQuery = q.toString()

  return (
    <div className="animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="font-syne font-extrabold text-xl sm:text-2xl mb-1">
            Produtos{' '}
            <span className="text-muted font-normal text-base">({total})</span>
          </h1>
          <p className="text-sm text-muted">Gerencie o catálogo da sua loja</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted" title="Cor, modelo, estampa ou material diferente conta como 1 produto. Tamanhos são variações gratuitas.">
            <span className={`font-semibold ${productLimit !== null && totalProductCount >= productLimit ? 'text-warm' : 'text-foreground'}`}>
              {totalProductCount}
            </span>
            <span>de</span>
            <span className="font-semibold">{productLimit === null ? '∞' : productLimit}</span>
            <span>produtos usados</span>
            {productLimit !== null && totalProductCount >= productLimit && (
              <span className="ml-1 text-[10px] font-bold uppercase tracking-wide text-warm px-1.5 py-0.5 rounded border border-warm/30 bg-warm/10">
                Limite atingido
              </span>
            )}
          </div>
        </div>
        <Link
          href="/admin/produtos/novo"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-primary/10 border border-primary rounded-xl text-primary text-sm font-semibold hover:bg-primary/20 transition-all shrink-0 self-start"
        >
          <Plus size={18} aria-hidden />
          Novo produto
        </Link>
      </div>

      <form action={basePath} method="GET" className="flex flex-col gap-3 mb-6">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
          <div className="flex-1 min-w-0">
            <label htmlFor="prod-search" className="text-[11px] text-muted block mb-1">
              Buscar
            </label>
            <input
              id="prod-search"
              type="search"
              name="search"
              defaultValue={searchTerm}
              placeholder="Nome do produto"
              className="w-full min-h-[44px] px-4 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary placeholder:text-muted"
            />
          </div>
          <div className="sm:w-40 min-w-0">
            <label htmlFor="prod-active" className="text-[11px] text-muted block mb-1">
              Situação
            </label>
            <select
              id="prod-active"
              name="active"
              defaultValue={activeFilter}
              className="w-full min-h-[44px] px-3 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary"
            >
              <option value="all">Todos</option>
              <option value="active">Ativos na vitrine</option>
              <option value="inactive">Ocultos</option>
            </select>
          </div>
          <div className="sm:w-44 min-w-0">
            <label htmlFor="prod-sort" className="text-[11px] text-muted block mb-1">
              Ordenar
            </label>
            <select
              id="prod-sort"
              name="sort"
              defaultValue={sort}
              className="w-full min-h-[44px] px-3 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary"
            >
              <option value="newest">Mais recentes</option>
              <option value="oldest">Mais antigos</option>
              <option value="name">Nome A–Z</option>
              <option value="price">Menor preço</option>
            </select>
          </div>
          <button
            type="submit"
            className="min-h-[44px] px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 shrink-0"
          >
            Aplicar
          </button>
        </div>
      </form>

      {products.length > 0 ? (
        <>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {(products as Product[]).map(p => {
              const nVar = p.variants_json?.length ?? 0
              const oos = productOutOfStock(p)
              return (
                <div
                  key={p.id}
                  className="bg-surface border border-border rounded-2xl p-5 hover:border-border/60 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-12 h-12 bg-surface2 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                        {p.variants_json[0]?.photos[0] ? (
                          <img
                            src={p.variants_json[0].photos[0]}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Shirt size={22} className="text-muted" aria-hidden />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-syne font-semibold text-sm truncate" title={p.name}>
                          {p.name}
                        </div>
                        <div className="text-xs text-muted">{getCategoryLabel(p.category)}</div>
                      </div>
                    </div>
                    <div
                      className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                        p.active ? 'bg-accent shadow-[0_0_6px_var(--accent-glow)]' : 'bg-muted'
                      }`}
                      title={p.active ? 'Ativo na vitrine' : 'Oculto da vitrine'}
                    />
                  </div>

                  {oos && (
                    <div className="mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border border-warm/40 text-warm bg-warm/10">
                        Sem estoque
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-accent font-bold text-base tabular-nums">
                      R${Number(p.price).toFixed(2).replace('.', ',')}
                    </span>
                    {p.promo_price && (
                      <span className="text-xs text-muted line-through tabular-nums">
                        R${Number(p.promo_price).toFixed(2).replace('.', ',')}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-muted mb-2">
                    {nVar} {nVar === 1 ? 'variação' : 'variações'}
                  </p>

                  <div className="flex gap-1 flex-wrap mb-3">
                    {p.variants_json.map((v: { id: string; color: string; colorHex: string }) => (
                      <span
                        key={v.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-border text-xs text-muted"
                      >
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: v.colorHex }} />
                        {v.color}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/admin/produtos/${p.id}`}
                      className="flex-1 text-center text-xs py-2 min-h-[40px] flex items-center justify-center border border-border rounded-lg text-muted hover:border-primary hover:text-primary transition-all"
                    >
                      Editar
                    </Link>
                    <ToggleActiveButton productId={p.id} active={p.active} />
                    <DeleteProductButton productId={p.id} productName={p.name} />
                  </div>
                </div>
              )
            })}
          </div>
          <Pagination page={page} totalPages={totalPages} basePath={basePath} query={paginationQuery} />
        </>
      ) : (
        <div className="text-center py-20 text-muted">
          <Shirt className="w-14 h-14 mx-auto mb-3 opacity-40" aria-hidden />
          <p className="font-medium">Nenhum produto encontrado</p>
          <p className="text-sm mt-1 mb-6">
            {hasSearch || activeFilter !== 'all'
              ? 'Tente outros filtros ou limpe a busca.'
              : 'Cadastre seu primeiro produto com ajuda da IA'}
          </p>
          {!hasSearch && activeFilter === 'all' ? (
            <Link
              href="/admin/produtos/novo"
              className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] bg-primary text-white rounded-xl font-syne font-bold text-sm hover:shadow-[0_4px_20px_var(--primary-glow)] transition-all"
            >
              <Plus size={18} aria-hidden />
              Cadastrar com IA
            </Link>
          ) : (
            <Link
              href={basePath}
              className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] border border-border rounded-xl text-sm font-semibold hover:border-primary"
            >
              Limpar filtros
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
