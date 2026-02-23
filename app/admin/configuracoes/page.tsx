import { redirect }  from 'next/navigation'
import { getSession } from '@/lib/auth'
import { sql }        from '@/lib/db'
import ConfigForm     from './ConfigForm'
import type { Store } from '@/types'

export default async function ConfiguracoesPage() {
  const session = await getSession()
  if (!session) redirect('/admin')

  const rows = await sql`SELECT * FROM stores WHERE id = ${session.storeId} LIMIT 1`
  const store = rows[0] as Store | undefined

  if (!store) redirect('/cadastro')

  return (
    <div className="animate-fade-up max-w-lg">
      <div className="mb-6">
        <h1 className="font-syne font-extrabold text-2xl mb-1">Configurações</h1>
        <p className="text-sm text-muted">Gerencie os dados da sua loja</p>
      </div>
      <ConfigForm store={store} />
    </div>
  )
}
