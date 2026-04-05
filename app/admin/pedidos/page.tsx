import { redirect }   from 'next/navigation'
import { getSessionSafe }  from '@/lib/auth'
import { sql }         from '@/lib/db'
import PedidoCard      from '@/components/admin/PedidoCard'
import Pagination      from '@/components/ui/Pagination'
import type { Order, OrderStatus } from '@/types'

const STATUS_FILTERS: Array<{ value: OrderStatus | 'TODOS'; label: string }> = [
  { value: 'TODOS',      label: 'Todos' },
  { value: 'NOVO',       label: '🔵 Novos' },
  { value: 'CONFIRMADO', label: '✅ Confirmados' },
  { value: 'EM_ENTREGA', label: '🚚 Em Entrega' },
  { value: 'ENTREGUE',   label: '✔️ Entregues' },
  { value: 'CANCELADO',  label: '❌ Cancelados' },
]

const SOURCE_FILTERS = [
  { value: '',          label: 'Todas origens' },
  { value: 'WHATSAPP',  label: '📱 WhatsApp' },
  { value: 'CHECKOUT',  label: '🌐 Site' },
  { value: 'PDV',       label: '🛒 PDV' },
]

const PAGE_SIZE = 20

interface Props {
  searchParams: Promise<{ status?: string; search?: string; page?: string; source?: string }>
}

export default async function PedidosPage({ searchParams }: Props) {
  const session = await getSessionSafe()
  if (!session) redirect('/admin')

  const params       = await searchParams
  const storeId      = session.storeId
  const statusFilter = params.status as OrderStatus | 'TODOS' | undefined
  const searchTerm   = params.search?.trim() ?? ''
  const sourceFilter = params.source ?? ''
  const page         = Math.max(1, parseInt(params.page ?? '1', 10) || 1)
  const offset       = (page - 1) * PAGE_SIZE

  const q         = searchTerm ? `%${searchTerm}%` : null
  const hasStatus = !!(statusFilter && statusFilter !== 'TODOS')
  const hasSource = !!sourceFilter
  const hasSearch = !!q

  const countRows = await sql`
    SELECT COUNT(*)::int as c FROM orders
    WHERE store_id = ${storeId}
    AND (${!hasStatus} OR status = ${hasStatus ? statusFilter! : 'NOVO'}::order_status)
    AND (${!hasSource} OR payment_source = ${hasSource ? sourceFilter : null})
    AND (${!hasSearch} OR customer_name ILIKE ${q ?? ''} OR order_number ILIKE ${q ?? ''})
  `
  const total = Number(countRows[0]?.c ?? 0)

  const orders = await sql`
    SELECT * FROM orders
    WHERE store_id = ${storeId}
    AND (${!hasStatus} OR status = ${hasStatus ? statusFilter! : 'NOVO'}::order_status)
    AND (${!hasSource} OR payment_source = ${hasSource ? sourceFilter : null})
    AND (${!hasSearch} OR customer_name ILIKE ${q ?? ''} OR order_number ILIKE ${q ?? ''})
    ORDER BY created_at DESC
    LIMIT ${PAGE_SIZE} OFFSET ${offset}
  `

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const baseUrl = '/admin/pedidos'
  const queryParts: string[] = []
  if (hasStatus) queryParts.push(`status=${encodeURIComponent(statusFilter!)}`)
  if (hasSource) queryParts.push(`source=${encodeURIComponent(sourceFilter)}`)
  if (searchTerm) queryParts.push(`search=${encodeURIComponent(searchTerm)}`)
  const paginationQuery = queryParts.join('&')

  function buildHref(overrides: Record<string, string>) {
    const merged = {
      ...(hasStatus ? { status: statusFilter! } : {}),
      ...(hasSource ? { source: sourceFilter } : {}),
      ...(searchTerm ? { search: searchTerm } : {}),
      ...overrides,
    }
    const qs = Object.entries(merged)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&')
    return qs ? `${baseUrl}?${qs}` : baseUrl
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <h1 className="font-syne font-extrabold text-xl sm:text-2xl mb-1">Pedidos</h1>
        <p className="text-sm text-muted">Acompanhe e gerencie todos os pedidos da sua loja</p>
        <p className="text-xs text-muted mt-2 tabular-nums">
          {total === 1 ? '1 pedido encontrado' : `${total} pedidos encontrados`}
        </p>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        <form action={baseUrl} method="GET" className="flex gap-2 flex-1 min-w-0">
          {hasStatus && <input type="hidden" name="status" value={statusFilter!} />}
          {hasSource && <input type="hidden" name="source" value={sourceFilter} />}
          <input
            type="search"
            name="search"
            defaultValue={searchTerm}
            placeholder="Buscar por cliente ou número do pedido"
            className="flex-1 min-w-0 min-h-[44px] px-4 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary placeholder:text-muted"
          />
          <button type="submit" className="min-h-[44px] px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shrink-0">
            Buscar
          </button>
        </form>

        {/* Filtro de status */}
        <div className="overflow-x-auto overflow-y-hidden -mx-1 px-1 pb-1 scrollbar-thin">
          <div className="flex gap-2 flex-nowrap min-w-min">
            {STATUS_FILTERS.map(f => (
              <a
                key={f.value}
                href={buildHref(f.value === 'TODOS' ? { status: '' } : { status: f.value })}
                className={`px-3.5 py-2 min-h-[40px] inline-flex items-center rounded-full text-xs font-semibold border transition-all whitespace-nowrap shrink-0 ${
                  (statusFilter ?? 'TODOS') === f.value
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-surface border-border text-muted hover:text-foreground'
                }`}
              >
                {f.label}
              </a>
            ))}
          </div>
        </div>

        {/* Filtro de origem */}
        <div className="overflow-x-auto overflow-y-hidden -mx-1 px-1 pb-0.5 scrollbar-thin">
          <div className="flex gap-2 flex-nowrap min-w-min">
            {SOURCE_FILTERS.map(f => (
              <a
                key={f.value}
                href={buildHref({ source: f.value })}
                className={`px-3.5 py-2 min-h-[38px] inline-flex items-center rounded-full text-xs font-semibold border transition-all whitespace-nowrap shrink-0 ${
                  sourceFilter === f.value
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-surface border-border text-muted hover:text-foreground'
                }`}
              >
                {f.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {orders.length > 0 ? (
        <>
          <div className="flex flex-col gap-3">
            {(orders as Order[]).map(order => (
              <PedidoCard key={order.id} order={order} storeId={storeId} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} basePath={baseUrl} query={paginationQuery} />
        </>
      ) : (
        <div className="text-center py-20 text-muted">
          <div className="text-5xl mb-3">📋</div>
          <p className="font-medium">Nenhum pedido encontrado</p>
          <p className="text-sm mt-1">
            {hasStatus || hasSource
              ? 'Tente outro filtro'
              : 'Os pedidos aparecem aqui quando clientes finalizam a compra'}
          </p>
        </div>
      )}
    </div>
  )
}
