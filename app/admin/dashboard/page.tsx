import { redirect } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  ShoppingCart,
  CheckCircle2,
  Truck,
  Wallet,
  TrendingUp,
  Calendar,
} from 'lucide-react'
import { getSessionSafe } from '@/lib/auth'
import { sql } from '@/lib/db'
import MetricCard from '@/components/admin/MetricCard'
import PedidoCard from '@/components/admin/PedidoCard'
import RecoveryCard from '@/components/admin/RecoveryCard'
import RecoveryInfoModal from '@/components/admin/RecoveryInfoModal'
import ViUsageCard from '@/components/admin/ViUsageCard'
import ViLimitBanner from '@/components/admin/ViLimitBanner'
import AdminPageError from '@/components/admin/AdminPageError'
import LowStockPanel from '@/components/admin/LowStockPanel'
import { getViUsageStats } from '@/lib/vi-limits'
import { getLowStockSkus, normalizeStockAlerts } from '@/lib/stock-alerts'
import { formatPlanPrice } from '@/lib/plans'
import { adminPage, adminHeader } from '@/lib/admin-ui'
import type { Order, Product, StoreSettings, PlanSlug } from '@/types'
import { assessStoreViReadiness } from '@/lib/vi-readiness'

/** Só browser (hash / localStorage) — evita Invalid hook call no SSR dev. */
const DashboardHashRedirect = dynamic(
  () => import('@/components/admin/DashboardHashRedirect'),
  { ssr: false },
)
const ViReadinessCard = dynamic(
  () => import('@/components/admin/ViReadinessCard'),
  { ssr: false },
)

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
  return formatPlanPrice(Math.round(n * 100))
}

export default async function DashboardPage() {
  const session = await getSessionSafe()
  if (!session) redirect('/admin')

  const storeId = session.storeId
  const { start, end } = todayRange()
  const week = weekRange()
  const month = monthRange()

  let store: { name: string; plan?: PlanSlug; logo_url: string | null; slug: string; settings_json?: StoreSettings | null; created_at?: string } | undefined
  let viStats: Awaited<ReturnType<typeof getViUsageStats>>
  let novoRows: { c: number }[]
  let confirmadoRows: { c: number }[]
  let entregaRows: { c: number }[]
  let todayRows: { total: number }[]
  let weekRows: { total: number }[]
  let monthRows: { total: number }[]
  let recentRows: Order[]
  let recoveryRows: Order[]
  let activeProducts: Product[]

  try {
    const storeRows = await sql`SELECT name, plan, logo_url, slug, settings_json, created_at FROM stores WHERE id = ${storeId} LIMIT 1`
    store = storeRows[0] as typeof store
    const plan = store?.plan ?? 'free'
    const showRecovery = plan === 'pro' || plan === 'loja' || plan === 'enterprise'
    viStats = await getViUsageStats(storeId)

    ;[
      novoRows,
      confirmadoRows,
      entregaRows,
      todayRows,
      weekRows,
      monthRows,
      recentRows,
      recoveryRows,
      activeProducts,
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
      sql`SELECT * FROM products WHERE store_id = ${storeId} AND active = true ORDER BY name ASC`,
    ]) as [
      { c: number }[],
      { c: number }[],
      { c: number }[],
      { total: number }[],
      { total: number }[],
      { total: number }[],
      Order[],
      Order[],
      Product[],
    ]
  } catch (e) {
    console.error('[admin/dashboard]', e)
    return (
      <AdminPageError title="Dashboard">
        Não foi possível carregar o painel. Verifique as migrations{' '}
        <code className="font-mono text-xs">005</code>–<code className="font-mono text-xs">010</code> no banco
        (Neon SQL Editor) e tente novamente.
      </AdminPageError>
    )
  }

  const plan = store?.plan ?? 'free'
  const showRecovery = plan === 'pro' || plan === 'loja' || plan === 'enterprise'

  const ordersToRecover = recoveryRows || []
  const countNovo = Number(novoRows[0]?.c ?? 0)
  const countConf = Number(confirmadoRows[0]?.c ?? 0)
  const countEntrega = Number(entregaRows[0]?.c ?? 0)
  const totalHoje = (todayRows as { total: number }[]).reduce((s, o) => s + Number(o.total), 0)
  const totalSemana = (weekRows as { total: number }[]).reduce((s, o) => s + Number(o.total), 0)
  const totalMes = (monthRows as { total: number }[]).reduce((s, o) => s + Number(o.total), 0)
  const activeProductCount = (activeProducts ?? []).length
  const createdAt = store?.created_at ? new Date(store.created_at).getTime() : 0
  const isNewStore = createdAt > 0 && Date.now() - createdAt < 3 * 24 * 60 * 60 * 1000
  if (isNewStore && activeProductCount === 0) {
    redirect('/admin/loja?secao=identidade')
  }

  const hasLogo = Boolean(store?.logo_url?.trim())
  const baseUrl = typeof process.env.NEXT_PUBLIC_APP_URL === 'string' ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '') : ''
  const storePublicUrl = baseUrl && store?.slug ? `${baseUrl}/${store.slug}` : ''
  const viReadiness = assessStoreViReadiness((activeProducts ?? []) as Product[])
  const showViReadiness = Boolean(storePublicUrl)

  const stockAlerts = normalizeStockAlerts(store?.settings_json?.stockAlerts)
  const lowStockSkus = stockAlerts.enabled
    ? getLowStockSkus(activeProducts ?? [], stockAlerts)
    : []

  return (
    <div className={adminPage}>
      <DashboardHashRedirect />
      <div className={adminHeader}>
        <h1 className="font-syne font-extrabold text-xl sm:text-2xl mb-1">
          {greeting()}, {store?.name ?? 'loja'}!
        </h1>
        <p className="text-sm text-muted">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <ViLimitBanner percent={viStats.percent} />

      {/* Métricas: 2×2 no mobile; 4 colunas no desktop */}
      <div className="grid w-full gap-3 grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-4 mb-4 auto-rows-fr">
        <MetricCard
          icon={<ShoppingCart size={22} className="text-primary" />}
          value={countNovo}
          label="Novos pedidos"
          valueColor="text-primary"
          className="h-full"
        />
        <MetricCard
          icon={<CheckCircle2 size={22} className="text-blue-400" />}
          value={countConf}
          label="Confirmados hoje"
          valueColor="text-blue-400"
          className="h-full"
        />
        <MetricCard
          icon={<Truck size={22} className="text-yellow-400" />}
          value={countEntrega}
          label="Em entrega"
          valueColor="text-yellow-400"
          className="h-full"
        />
        <MetricCard
          icon={<Wallet size={22} className="text-accent" />}
          value={fmtMoney(totalHoje)}
          label="Total hoje"
          valueColor="text-accent"
          highlight
          className="h-full"
        />
      </div>

      <div className="grid w-full gap-3 grid-cols-1 md:grid-cols-3 mb-8">
        <ViUsageCard used={viStats.used} limit={viStats.limit} percent={viStats.percent} />
        <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 flex items-start gap-3 min-w-0 overflow-hidden">
          <TrendingUp size={20} className="text-muted shrink-0 mt-0.5" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted mb-1">Esta semana</p>
            <p
              className="font-syne font-extrabold text-lg sm:text-xl text-foreground tabular-nums truncate"
              title={fmtMoney(totalSemana)}
            >
              {fmtMoney(totalSemana)}
            </p>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 flex items-start gap-3 min-w-0 overflow-hidden">
          <Calendar size={20} className="text-muted shrink-0 mt-0.5" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted mb-1">Este mês</p>
            <p
              className="font-syne font-extrabold text-lg sm:text-xl text-foreground tabular-nums truncate"
              title={fmtMoney(totalMes)}
            >
              {fmtMoney(totalMes)}
            </p>
          </div>
        </div>
      </div>

      {showViReadiness && (
        <ViReadinessCard
          report={viReadiness}
          storeUrl={storePublicUrl}
          hasLogo={hasLogo}
        />
      )}

      {stockAlerts.enabled && (
        <LowStockPanel items={lowStockSkus} threshold={stockAlerts.threshold} />
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
          <p className="text-sm mt-1 break-words px-4">
            Compartilhe sua loja para receber pedidos.
            {storePublicUrl && (
              <>
                {' '}
                <a
                  href={storePublicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary font-semibold hover:underline"
                >
                  Abrir vitrine
                </a>
              </>
            )}
          </p>
        </div>
      )}
    </div>
  )
}
