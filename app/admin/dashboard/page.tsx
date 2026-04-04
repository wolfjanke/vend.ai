import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ShoppingCart,
  CheckCircle2,
  Truck,
  Wallet,
  Camera,
  ClipboardList,
  ExternalLink,
  TrendingUp,
  Calendar,
} from 'lucide-react'
import { getSessionSafe } from '@/lib/auth'
import { sql } from '@/lib/db'
import MetricCard from '@/components/admin/MetricCard'
import PedidoCard from '@/components/admin/PedidoCard'
import RecoveryCard from '@/components/admin/RecoveryCard'
import RecoveryInfoModal from '@/components/admin/RecoveryInfoModal'
import OnboardingChecklist from '@/components/admin/OnboardingChecklist'
import type { Order } from '@/types'
import type { PlanSlug } from '@/types'

function todayRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  return { start: start.toISOString(), end: end.toISOString() }
}

function weekRange() {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const start = new Date(now)
  start.setDate(diff)
  start.setHours(0, 0, 0, 0)
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

function fmtMoney(n: number) {
  return `R$\u00a0${n.toFixed(2).replace('.', ',')}`
}

export default async function DashboardPage() {
  const session = await getSessionSafe()
  if (!session) redirect('/admin')

  const storeId = session.storeId
  const { start, end } = todayRange()
  const week = weekRange()
  const month = monthRange()

  const storeRows = await sql`SELECT name, plan, logo_url, slug FROM stores WHERE id = ${storeId} LIMIT 1`
  const store = storeRows[0] as { name: string; plan?: PlanSlug; logo_url: string | null; slug: string } | undefined
  const plan = store?.plan ?? 'free'
  const showRecovery = plan === 'pro' || plan === 'loja'

  const baseUrl = typeof process.env.NEXT_PUBLIC_APP_URL === 'string' ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '') : ''
  const storePublicUrl = baseUrl && store?.slug ? `${baseUrl}/${store.slug}` : ''

  const [
    novoRows,
    confirmadoRows,
    entregaRows,
    todayRows,
    weekRows,
    monthRows,
    recentRows,
    recoveryRows,
    productCountRows,
  ] = await Promise.all([
    sql`SELECT COUNT(*) as c FROM orders WHERE store_id = ${storeId} AND status = 'NOVO'`,
    sql`SELECT COUNT(*) as c FROM orders WHERE store_id = ${storeId} AND status = 'CONFIRMADO' AND created_at >= ${start} AND created_at <= ${end}`,
    sql`SELECT COUNT(*) as c FROM orders WHERE store_id = ${storeId} AND status = 'EM_ENTREGA'`,
    sql`SELECT total FROM orders WHERE store_id = ${storeId} AND created_at >= ${start} AND created_at <= ${end} AND status != 'CANCELADO'`,
    sql`SELECT total FROM orders WHERE store_id = ${storeId} AND created_at >= ${week.start} AND created_at <= ${week.end} AND status != 'CANCELADO'`,
    sql`SELECT total FROM orders WHERE store_id = ${storeId} AND created_at >= ${month.start} AND created_at <= ${month.end} AND status != 'CANCELADO'`,
    sql`SELECT * FROM orders WHERE store_id = ${storeId} ORDER BY created_at DESC LIMIT 5`,
    showRecovery
      ? sql`SELECT * FROM orders WHERE store_id = ${storeId} AND status = 'NOVO' AND created_at < NOW() - INTERVAL '24 hours' AND recovery_sent_at IS NULL ORDER BY created_at DESC`
      : Promise.resolve([]),
    sql`SELECT COUNT(*)::int as c FROM products WHERE store_id = ${storeId}`,
  ])

  const ordersToRecover = (recoveryRows as Order[]) || []
  const countNovo = Number(novoRows[0]?.c ?? 0)
  const countConf = Number(confirmadoRows[0]?.c ?? 0)
  const countEntrega = Number(entregaRows[0]?.c ?? 0)
  const totalHoje = (todayRows as { total: number }[]).reduce((s, o) => s + Number(o.total), 0)
  const totalSemana = (weekRows as { total: number }[]).reduce((s, o) => s + Number(o.total), 0)
  const totalMes = (monthRows as { total: number }[]).reduce((s, o) => s + Number(o.total), 0)
  const productCount = Number(productCountRows[0]?.c ?? 0)
  const hasLogo = Boolean(store?.logo_url?.trim())
  const hasProducts = productCount > 0
  const showOnboarding = recentRows.length === 0 && storePublicUrl

  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <h1 className="font-syne font-extrabold text-xl sm:text-2xl mb-1">
          {greeting()}, {store?.name ?? 'loja'}!
        </h1>
        <p className="text-sm text-muted">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <MetricCard
          icon={<ShoppingCart size={22} className="text-primary" />}
          value={countNovo}
          label="Novos pedidos"
          valueColor="text-primary"
        />
        <MetricCard
          icon={<CheckCircle2 size={22} className="text-blue-400" />}
          value={countConf}
          label="Confirmados hoje"
          valueColor="text-blue-400"
        />
        <MetricCard
          icon={<Truck size={22} className="text-yellow-400" />}
          value={countEntrega}
          label="Em entrega"
          valueColor="text-yellow-400"
        />
        <MetricCard
          icon={<Wallet size={22} className="text-accent" />}
          value={fmtMoney(totalHoje)}
          label="Total hoje"
          valueColor="text-accent"
          highlight
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        <div className="bg-surface border border-border rounded-2xl p-4 flex items-start gap-3">
          <TrendingUp size={20} className="text-muted shrink-0 mt-0.5" aria-hidden />
          <div className="min-w-0">
            <p className="text-xs text-muted mb-1">Esta semana</p>
            <p className="font-syne font-extrabold text-xl text-foreground tabular-nums">{fmtMoney(totalSemana)}</p>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4 flex items-start gap-3">
          <Calendar size={20} className="text-muted shrink-0 mt-0.5" aria-hidden />
          <div className="min-w-0">
            <p className="text-xs text-muted mb-1">Este mês</p>
            <p className="font-syne font-extrabold text-xl text-foreground tabular-nums">{fmtMoney(totalMes)}</p>
          </div>
        </div>
      </div>

      {showOnboarding && (
        <OnboardingChecklist hasLogo={hasLogo} hasProducts={hasProducts} storeUrl={storePublicUrl} />
      )}

      {/* Pedidos para recuperar */}
      {showRecovery && ordersToRecover.length > 0 && (
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <h2 className="font-syne font-bold text-base">Pedidos para recuperar</h2>
            <RecoveryInfoModal />
          </div>
          <p className="text-xs text-muted mb-3">
            Pedidos em &quot;Novo&quot; há mais de 24h. Envie uma mensagem pelo WhatsApp para reativar a venda.
          </p>
          <div className="flex flex-col gap-3">
            {ordersToRecover.map(order => (
              <RecoveryCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}

      {/* Recent orders */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-syne font-bold text-base">Pedidos recentes</h2>
        <Link href="/admin/pedidos" className="text-xs text-primary hover:underline min-h-[44px] inline-flex items-center">
          Ver todos →
        </Link>
      </div>

      {recentRows.length > 0 ? (
        <div className="flex flex-col gap-3">
          {(recentRows as Order[]).map(order => (
            <PedidoCard key={order.id} order={order} storeId={storeId} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted">
          <ShoppingCart className="w-14 h-14 mx-auto mb-3 opacity-40" aria-hidden />
          <p className="font-medium">Nenhum pedido ainda</p>
          <p className="text-sm mt-1">Compartilhe sua loja para receber pedidos!</p>
        </div>
      )}

      {/* Quick actions */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/admin/produtos/novo"
          className="flex items-center gap-3 px-4 py-3 min-h-[48px] bg-primary/10 border border-primary/30 rounded-xl text-primary text-sm font-medium hover:bg-primary/20 transition-all"
        >
          <Camera size={20} aria-hidden />
          Novo produto
        </Link>
        <Link
          href="/admin/pedidos"
          className="flex items-center gap-3 px-4 py-3 min-h-[48px] bg-surface2 border border-border rounded-xl text-foreground text-sm font-medium hover:border-border/60 transition-all"
        >
          <ClipboardList size={20} aria-hidden />
          Todos os pedidos
        </Link>
        {store?.slug && (
          <a
            href={`/${store.slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 px-4 py-3 min-h-[48px] bg-accent/10 border border-accent/30 rounded-xl text-accent text-sm font-medium hover:bg-accent/20 transition-all"
          >
            <ExternalLink size={20} aria-hidden />
            Ver loja
          </a>
        )}
      </div>
    </div>
  )
}
