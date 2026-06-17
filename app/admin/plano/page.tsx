import { redirect } from 'next/navigation'
import { getSessionSafe } from '@/lib/auth'
import { sql } from '@/lib/db'
import SandboxBanner from '@/components/admin/SandboxBanner'
import PlanoClient from './PlanoClient'
import { adminPage, adminHeader } from '@/lib/admin-ui'
import type { Store } from '@/types'

export default async function PlanoPage() {
  const session = await getSessionSafe()
  if (!session) redirect('/admin')

  let ownerName = ''
  let storeName = ''
  try {
    const rows = await sql`SELECT name, settings_json FROM stores WHERE id = ${session.storeId} LIMIT 1`
    const store = rows[0] as Pick<Store, 'name' | 'settings_json'> | undefined
    const settings = store?.settings_json as { ownerName?: string } | undefined
    storeName = store?.name?.trim() ?? ''
    ownerName = settings?.ownerName?.trim() || storeName
  } catch {
    ownerName = ''
    storeName = ''
  }

  return (
    <div className={adminPage}>
      <div className={adminHeader}>
        <h1 className="font-syne font-extrabold text-xl sm:text-2xl mb-1">Plano</h1>
        <p className="text-sm text-muted break-words">
          Gerencie sua assinatura, período de trial gratuito e limites de uso
        </p>
      </div>
      <SandboxBanner />
      <PlanoClient ownerName={ownerName} storeName={storeName} />
    </div>
  )
}
