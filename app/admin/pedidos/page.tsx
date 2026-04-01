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

const PAGE_SIZE = 20

interface Props {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>
}

export default async function PedidosPage({ searchParams }: Props) {
  const session = await getSessionSafe()
  if (!session) redirect('/admin')

  const params = await searchParams
  const storeId      = session.storeId
  const statusFilter = params.status as OrderStatus | 'TODOS' | undefined
  const searchTerm   = params.search?.trim() ?? ''
  const page         = Math.max(1, parseInt(params.page ?? '1', 10) || 1)
  const offset       = (page - 1) * PAGE_SIZE

  const q = searchTerm ? `%${searchTerm}%` : null

  let orders: unknown[]
  let total = 0

  if (q) {
    if (statusFilter && statusFilter !== 'TODOS') {
      const countRows = await sql`
        SELECT COUNT(*)::int as c FROM orders
        WHERE store_id = ${storeId} AND status = ${statusFilter}::order_status
        AND (customer_name ILIKE ${q} OR order_number ILIKE ${q})
      `
      total = Number(countRows[0]?.c ?? 0)
      orders = await sql`
        SELECT * FROM orders
        WHERE store_id = ${storeId} AND status = ${statusFilter}::order_status
        AND (customer_name ILIKE ${q} OR order_number ILIKE ${q})
        ORDER BY created_at DESC
        LIMIT ${PAGE_SIZE} OFFSET ${offset}
      `
    } else {
      const countRows = await sql`
        SELECT COUNT(*)::int as c FROM orders
        WHERE store_id = ${storeId}
        AND (customer_name ILIKE ${q} OR order_number ILIKE ${q})
      `
      total = Number(countRows[0]?.c ?? 0)
      orders = await sql`
        SELECT * FROM orders
        WHERE store_id = ${storeId}
        AND (customer_name ILIKE ${q} OR order_number ILIKE ${q})
        ORDER BY created_at DESC
        LIMIT ${PAGE_SIZE} OFFSET ${offset}
      `
    }
  } else {
    if (statusFilter && statusFilter !== 'TODOS') {
      const countRows = await sql`
        SELECT COUNT(*)::int as c FROM orders
        WHERE store_id = ${storeId} AND status = ${statusFilter}::order_status
      `
      total = Number(countRows[0]?.c ?? 0)
      orders = await sql`
        SELECT * FROM orders
        WHERE store_id = ${storeId} AND status = ${statusFilter}::order_status
        ORDER BY created_at DESC
        LIMIT ${PAGE_SIZE} OFFSET ${offset}
      `
    } else {
      const countRows = await sql`SELECT COUNT(*)::int as c FROM orders WHERE store_id = ${storeId}`
      total = Number(countRows[0]?.c ?? 0)
      orders = await sql`
        SELECT * FROM orders WHERE store_id = ${storeId}
        ORDER BY created_at DESC
        LIMIT ${PAGE_SIZE} OFFSET ${offset}
      `
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const baseUrl = '/admin/pedidos'
  const queryParts: string[] = []
  if (statusFilter && statusFilter !== 'TODOS') queryParts.push(`status=${encodeURIComponent(statusFilter)}`)
  if (searchTerm) queryParts.push(`search=${encodeURIComponent(searchTerm)}`)
  const paginationQuery = queryParts.join('&')

  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <h1 className="font-syne font-extrabold text-xl sm:text-2xl mb-1">Pedidos</h1>
        <p className="text-sm text-muted">Acompanhe e gerencie todos os pedidos da sua loja</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form action={baseUrl} method="GET" className="flex gap-2 flex-1 min-w-0">
          {statusFilter && statusFilter !== 'TODOS' && (
            <input type="hidden" name="status" value={statusFilter} />
          )}
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
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map(f => {
            const href = f.value === 'TODOS'
              ? (searchTerm ? `${baseUrl}?search=${encodeURIComponent(searchTerm)}` : baseUrl)
              : searchTerm
                ? `${baseUrl}?status=${f.value}&search=${encodeURIComponent(searchTerm)}`
                : `${baseUrl}?status=${f.value}`
            return (
              <a
                key={f.value}
                href={href}
                className={`px-3.5 py-2 min-h-[40px] inline-flex items-center rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
                  (statusFilter ?? 'TODOS') === f.value
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-surface border-border text-muted hover:text-foreground'
                }`}
              >
                {f.label}
              </a>
            )
          })}
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
            {statusFilter && statusFilter !== 'TODOS'
              ? 'Tente outro filtro de status'
              : 'Os pedidos aparecem aqui quando clientes finalizam a compra'}
          </p>
        </div>
      )}
    </div>
  )
}
