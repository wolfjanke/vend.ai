import { redirect } from 'next/navigation'
import { getSessionSafe } from '@/lib/auth'
import PlanoClient from './PlanoClient'
import { adminPage, adminHeader } from '@/lib/admin-ui'

export default async function PlanoPage() {
  const session = await getSessionSafe()
  if (!session) redirect('/admin')

  return (
    <div className={adminPage}>
      <div className={adminHeader}>
        <h1 className="font-syne font-extrabold text-xl sm:text-2xl mb-1">Plano</h1>
        <p className="text-sm text-muted break-words">
          Gerencie sua assinatura, período de trial gratuito e limites de uso
        </p>
      </div>
      <PlanoClient />
    </div>
  )
}
