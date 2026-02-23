import { redirect }  from 'next/navigation'
import { getSession } from '@/lib/auth'
import ProdutoForm    from '@/components/admin/ProdutoForm'

export default async function NovoProdutoPage() {
  const session = await getSession()
  if (!session) redirect('/admin')

  return (
    <div className="animate-fade-up max-w-2xl">
      <div className="mb-6">
        <h1 className="font-syne font-extrabold text-2xl mb-1">Novo Produto 📸</h1>
        <p className="text-sm text-muted">
          Selecione as fotos da galeria — a IA identifica variações de cor e preenche tudo automaticamente
        </p>
      </div>
      <ProdutoForm storeId={session.storeId} />
    </div>
  )
}
