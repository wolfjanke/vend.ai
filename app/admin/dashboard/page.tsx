import { redirect } from 'next/navigation'
import Link         from 'next/link'
import { getSession }  from '@/lib/auth'
import { sql }         from '@/lib/db'
import MetricCard      from '@/components/admin/MetricCard'
import PedidoCard      from '@/components/admin/PedidoCard'
import type { Order }  from '@/types'

function todayRange() {
  const start = new Date(); start.setHours(0, 0, 0, 0)
  const end   = new Date(); end.setHours(23, 59, 59, 999)
  return { start: start.toISOString(), end: end.toISOString() }
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/admin')

  const storeId = session.storeId
  const { start, end } = todayRange()

  const [storeRows, novoRows, confirmadoRows, entregaRows, todayRows, recentRows] = await Promise.all([
    sql`SELECT name FROM stores WHERE id = ${storeId} LIMIT 1`,
    sql`SELECT COUNT(*) as c FROM orders WHERE store_id = ${storeId} AND status = 'NOVO'`,
    sql`SELECT COUNT(*) as c FROM orders WHERE store_id = ${storeId} AND status = 'CONFIRMADO' AND created_at >= ${start} AND created_at <= ${end}`,
    sql`SELECT COUNT(*) as c FROM orders WHERE store_id = ${storeId} AND status = 'EM_ENTREGA'`,
    sql`SELECT total FROM orders WHERE store_id = ${storeId} AND created_at >= ${start} AND created_at <= ${end} AND status != 'CANCELADO'`,
    sql`SELECT * FROM orders WHERE store_id = ${storeId} ORDER BY created_at DESC LIMIT 5`,
  ])

  const store        = storeRows[0] as { name: string } | undefined
  const countNovo    = Number(novoRows[0]?.c ?? 0)
  const countConf    = Number(confirmadoRows[0]?.c ?? 0)
  const countEntrega = Number(entregaRows[0]?.c ?? 0)
  const totalHoje    = (todayRows as { total: number }[]).reduce((s, o) => s + Number(o.total), 0)

  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <h1 className="font-syne font-extrabold text-2xl mb-1">
          {greeting()}, {store?.name ?? 'loja'}! 👋
        </h1>
        <p className="text-sm text-muted">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <MetricCard icon="🛍️" value={countNovo}    label="Novos Pedidos"    valueColor="text-primary" />
        <MetricCard icon="✅" value={countConf}     label="Confirmados Hoje" valueColor="text-blue-400" />
        <MetricCard icon="📦" value={countEntrega}  label="Em Entrega"       valueColor="text-yellow-400" />
        <MetricCard icon="💰" value={`R$\u00a0${totalHoje.toFixed(2).replace('.', ',')}`} label="Total Hoje" valueColor="text-accent" highlight />
      </div>

      {/* Recent orders */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-syne font-bold text-base">Pedidos Recentes</h2>
        <Link href="/admin/pedidos" className="text-xs text-primary hover:underline">Ver todos →</Link>
      </div>

      {recentRows.length > 0 ? (
        <div className="flex flex-col gap-3">
          {(recentRows as Order[]).map(order => (
            <PedidoCard key={order.id} order={order} storeId={storeId} />
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
