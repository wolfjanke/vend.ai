import { createClient } from '@/lib/supabase'
import { redirect }     from 'next/navigation'
import Link             from 'next/link'
import MetricCard       from '@/components/admin/MetricCard'
import PedidoCard       from '@/components/admin/PedidoCard'
import type { Order }   from '@/types'

function todayRange() {
  const start = new Date(); start.setHours(0, 0, 0, 0)
  const end   = new Date(); end.setHours(23, 59, 59, 999)
  return { start: start.toISOString(), end: end.toISOString() }
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin')

  const { data: store } = await supabase.from('stores').select('id, name').eq('user_id', user.id).single()
  if (!store) redirect('/cadastro')

  const { start, end } = todayRange()

  const [
    { count: countNovo },
    { count: countConfirmado },
    { count: countEntrega },
    { data: ordersToday },
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('store_id', store.id).eq('status', 'NOVO'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('store_id', store.id).eq('status', 'CONFIRMADO').gte('created_at', start).lte('created_at', end),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('store_id', store.id).eq('status', 'EM_ENTREGA'),
    supabase.from('orders').select('total').eq('store_id', store.id).gte('created_at', start).lte('created_at', end).neq('status', 'CANCELADO'),
    supabase.from('orders').select('*').eq('store_id', store.id).order('created_at', { ascending: false }).limit(5),
  ])

  const totalHoje = (ordersToday ?? []).reduce((sum: number, o: { total: number }) => sum + o.total, 0)

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <h1 className="font-syne font-extrabold text-2xl mb-1">{greeting()}, {store.name}! 👋</h1>
        <p className="text-sm text-muted">{new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <MetricCard icon="🛍️" value={countNovo  ?? 0}  label="Novos Pedidos"   valueColor="text-primary" />
        <MetricCard icon="✅" value={countConfirmado ?? 0} label="Confirmados Hoje" valueColor="text-blue-400" />
        <MetricCard icon="📦" value={countEntrega ?? 0} label="Em Entrega"      valueColor="text-yellow-400" />
        <MetricCard icon="💰" value={`R$\u00a0${totalHoje.toFixed(2).replace('.', ',')}`} label="Total Hoje" valueColor="text-accent" highlight />
      </div>

      {/* Recent orders */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-syne font-bold text-base">Pedidos Recentes</h2>
        <Link href="/admin/pedidos" className="text-xs text-primary hover:underline">Ver todos →</Link>
      </div>

      {recentOrders && recentOrders.length > 0 ? (
        <div className="flex flex-col gap-3">
          {(recentOrders as Order[]).map(order => (
            <PedidoCard key={order.id} order={order} storeId={store.id} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted">
          <div className="text-5xl mb-3">🛍️</div>
          <p className="font-medium">Nenhum pedido ainda</p>
          <p className="text-sm mt-1">Compartilhe sua loja para receber pedidos!</p>
        </div>
      )}

      {/* Quick actions */}
      <div className="mt-8 flex gap-3 flex-wrap">
        <Link href="/admin/produtos/novo" className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border border-primary/30 rounded-xl text-primary text-sm font-medium hover:bg-primary/20 transition-all">
          📸 Novo produto
        </Link>
        <Link href="/admin/pedidos" className="flex items-center gap-2 px-4 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm font-medium hover:border-border/60 transition-all">
          📋 Todos os pedidos
        </Link>
      </div>
    </div>
  )
}
