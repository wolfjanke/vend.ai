import { redirect } from 'next/navigation'
import { getSessionSafe } from '@/lib/auth'
import PlanoClient from './PlanoClient'

export default async function PlanoPage() {
  const session = await getSessionSafe()
  if (!session) redirect('/admin')

  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <h1 className="font-syne font-extrabold text-xl sm:text-2xl mb-1">Plano</h1>
        <p className="text-sm text-muted break-words">
          Gerencie sua assinatura, trial e limites de uso
        </p>
      </div>
      <PlanoClient />
    </div>
  )
}
