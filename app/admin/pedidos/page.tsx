import { redirect }   from 'next/navigation'
import { getSession }  from '@/lib/auth'
import { sql }         from '@/lib/db'
import PedidoCard      from '@/components/admin/PedidoCard'
import type { Order, OrderStatus } from '@/types'

const STATUS_FILTERS: Array<{ value: OrderStatus | 'TODOS'; label: string }> = [
  { value: 'TODOS',      label: 'Todos' },
  { value: 'NOVO',       label: '🔵 Novos' },
  { value: 'CONFIRMADO', label: '✅ Confirmados' },
  { value: 'EM_ENTREGA', label: '🚚 Em Entrega' },
  { value: 'ENTREGUE',   label: '✔️ Entregues' },
  { value: 'CANCELADO',  label: '❌ Cancelados' },
]

interface Props {
  searchParams: Promise<{ status?: string; search?: string }>
}

export default async function PedidosPage({ searchParams }: Props) {
  const session = await getSession()
  if (!session) redirect('/admin')

  const params = await searchParams
  const storeId      = session.storeId
  const statusFilter = params.status as OrderStatus | 'TODOS' | undefined
  const searchTerm   = params.search?.trim() ?? ''

  let orders = statusFilter && statusFilter !== 'TODOS'
    ? await sql`SELECT * FROM orders WHERE store_id = ${storeId} AND status = ${statusFilter}::order_status ORDER BY created_at DESC`
    : await sql`SELECT * FROM orders WHERE store_id = ${storeId} ORDER BY created_at DESC`

  if (searchTerm) {
    const term = searchTerm.toLowerCase()
    orders = (orders as Order[]).filter(
      o => o.customer_name?.toLowerCase().includes(term) || o.order_number?.toLowerCase().includes(term)
    )
  }

  const baseUrl = '/admin/pedidos'

  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <h1 className="font-syne font-extrabold text-2xl mb-1">Pedidos</h1>
        <p className="text-sm text-muted">Acompanhe e gerencie todos os pedidos da sua loja</p>
      </div>

      {/* Search + Status filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form action={baseUrl} method="GET" className="flex gap-2 flex-1">
          {statusFilter && statusFilter !== 'TODOS' && (
            <input type="hidden" name="status" value={statusFilter} />
          )}
          <input
            type="search"
            name="search"
            defaultValue={searchTerm}
            placeholder="Buscar por cliente ou número do pedido"
            className="flex-1 min-w-0 px-4 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary placeholder:text-muted"
          />
          <button type="submit" className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
            Buscar
          </button>
        </form>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map(f => {
            const href = f.value === 'TODOS' ? (searchTerm ? `${baseUrl}?search=${encodeURIComponent(searchTerm)}` : baseUrl) : searchTerm ? `${baseUrl}?status=${f.value}&search=${encodeURIComponent(searchTerm)}` : `${baseUrl}?status=${f.value}`
            return (
              <a
                key={f.value}
                href={href}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
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
        <div className="flex flex-col gap-3">
          {(orders as Order[]).map(order => (
            <PedidoCard key={order.id} order={order} storeId={storeId} />
          ))}
        </div>
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
