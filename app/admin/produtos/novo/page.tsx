import { createClient } from '@/lib/supabase'
import { redirect }     from 'next/navigation'
import ProdutoForm      from '@/components/admin/ProdutoForm'

export default async function NovoProdutoPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin')

  const { data: store } = await supabase.from('stores').select('id').eq('user_id', user.id).single()
  if (!store) redirect('/cadastro')

  return (
    <div className="animate-fade-up max-w-2xl">
      <div className="mb-6">
        <h1 className="font-syne font-extrabold text-2xl mb-1">Novo Produto 📸</h1>
        <p className="text-sm text-muted">Selecione as fotos da galeria — a IA identifica variações de cor e preenche tudo automaticamente</p>
      </div>
      <ProdutoForm storeId={store.id} />
    </div>
  )
}
