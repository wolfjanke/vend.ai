import { redirect } from 'next/navigation'
import Link         from 'next/link'
import { getSession }  from '@/lib/auth'
import { sql }         from '@/lib/db'
import MetricCard      from '@/components/admin/MetricCard'
import PedidoCard      from '@/components/admin/PedidoCard'
import RecoveryCard    from '@/components/admin/RecoveryCard'
import type { Order }  from '@/types'
import type { PlanSlug } from '@/types'

function todayRange() {
  const start = new Date(); start.setHours(0, 0, 0, 0)
  const end   = new Date(); end.setHours(23, 59, 59, 999)
  return { start: start.toISOString(), end: end.toISOString() }
}

function weekRange() {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const start = new Date(now); start.setDate(diff); start.setHours(0, 0, 0, 0)
  const end = new Date()
  return { start: start.toISOString(), end: end.toISOString() }
}

function monthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date()
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
  const week = weekRange()
  const month = monthRange()

  const storeRows = await sql`SELECT name, plan FROM stores WHERE id = ${storeId} LIMIT 1`
  const store        = storeRows[0] as { name: string; plan?: PlanSlug } | undefined
  const plan         = store?.plan ?? 'free'
  const showRecovery = plan === 'pro' || plan === 'loja'

  const [novoRows, confirmadoRows, entregaRows, todayRows, weekRows, monthRows, recentRows, recoveryRows] = await Promise.all([
    sql`SELECT COUNT(*) as c FROM orders WHERE store_id = ${storeId} AND status = 'NOVO'`,
    sql`SELECT COUNT(*) as c FROM orders WHERE store_id = ${storeId} AND status = 'CONFIRMADO' AND created_at >= ${start} AND created_at <= ${end}`,
    sql`SELECT COUNT(*) as c FROM orders WHERE store_id = ${storeId} AND status = 'EM_ENTREGA'`,
    sql`SELECT total FROM orders WHERE store_id = ${storeId} AND created_at >= ${start} AND created_at <= ${end} AND status != 'CANCELADO'`,
    sql`SELECT total FROM orders WHERE store_id = ${storeId} AND created_at >= ${week.start} AND created_at <= ${week.end} AND status != 'CANCELADO'`,
    sql`SELECT total FROM orders WHERE store_id = ${storeId} AND created_at >= ${month.start} AND created_at <= ${month.end} AND status != 'CANCELADO'`,
    sql`SELECT * FROM orders WHERE store_id = ${storeId} ORDER BY created_at DESC LIMIT 5`,
    showRecovery ? sql`SELECT * FROM orders WHERE store_id = ${storeId} AND status = 'NOVO' AND created_at < NOW() - INTERVAL '24 hours' AND recovery_sent_at IS NULL ORDER BY created_at DESC` : Promise.resolve([]),
  ])

  const ordersToRecover = (recoveryRows as Order[]) || []
  const countNovo    = Number(novoRows[0]?.c ?? 0)
  const countConf    = Number(confirmadoRows[0]?.c ?? 0)
  const countEntrega = Number(entregaRows[0]?.c ?? 0)
  const totalHoje    = (todayRows as { total: number }[]).reduce((s, o) => s + Number(o.total), 0)
  const totalSemana  = (weekRows as { total: number }[]).reduce((s, o) => s + Number(o.total), 0)
  const totalMes     = (monthRows as { total: number }[]).reduce((s, o) => s + Number(o.total), 0)

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard icon="🛍️" value={countNovo}    label="Novos Pedidos"    valueColor="text-primary" />
        <MetricCard icon="✅" value={countConf}     label="Confirmados Hoje" valueColor="text-blue-400" />
        <MetricCard icon="📦" value={countEntrega}  label="Em Entrega"       valueColor="text-yellow-400" />
        <MetricCard icon="💰" value={`R$\u00a0${totalHoje.toFixed(2).replace('.', ',')}`} label="Total Hoje" valueColor="text-accent" highlight />
      </div>
      <div className="flex flex-wrap gap-4 mb-8 text-sm">
        <span className="text-muted">Esta semana: <strong className="text-foreground">R$ {totalSemana.toFixed(2).replace('.', ',')}</strong></span>
        <span className="text-muted">Este mês: <strong className="text-foreground">R$ {totalMes.toFixed(2).replace('.', ',')}</strong></span>
      </div>

      {/* Pedidos para recuperar - só para planos pro/loja */}
      {showRecovery && ordersToRecover.length > 0 && (
        <div className="mb-8">
          <h2 className="font-syne font-bold text-base mb-4">Pedidos para recuperar</h2>
          <p className="text-xs text-muted mb-3">Pedidos enviados há mais de 24h que ainda não foram pagos. Envie uma mensagem pelo WhatsApp para reativar a venda.</p>
          <div className="flex flex-col gap-3">
            {ordersToRecover.map(order => (
              <RecoveryCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}

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
