import { createClient } from '@/lib/supabase'
import { redirect }     from 'next/navigation'
import PedidoCard       from '@/components/admin/PedidoCard'
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
  searchParams: { status?: string }
}

export default async function PedidosPage({ searchParams }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin')

  const { data: store } = await supabase.from('stores').select('id').eq('user_id', user.id).single()
  if (!store) redirect('/cadastro')

  const statusFilter = searchParams.status as OrderStatus | 'TODOS' | undefined

  let query = supabase
    .from('orders')
    .select('*')
    .eq('store_id', store.id)
    .order('created_at', { ascending: false })

  if (statusFilter && statusFilter !== 'TODOS') {
    query = query.eq('status', statusFilter)
  }

  const { data: orders } = await query

  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <h1 className="font-syne font-extrabold text-2xl mb-1">Pedidos</h1>
        <p className="text-sm text-muted">Acompanhe e gerencie todos os pedidos da sua loja</p>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {STATUS_FILTERS.map(f => (
          <a key={f.value} href={f.value === 'TODOS' ? '/admin/pedidos' : `/admin/pedidos?status=${f.value}`} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
            (statusFilter ?? 'TODOS') === f.value
              ? 'bg-primary/20 border-primary text-primary'
              : 'bg-surface border-border text-muted hover:text-foreground'
          }`}>
            {f.label}
          </a>
        ))}
      </div>

      {orders && orders.length > 0 ? (
        <div className="flex flex-col gap-3">
          {(orders as Order[]).map(order => (
            <PedidoCard key={order.id} order={order} storeId={store.id} />
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
