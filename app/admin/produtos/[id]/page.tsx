import { redirect, notFound } from 'next/navigation'
import { getSessionSafe } from '@/lib/auth'
import { sql } from '@/lib/db'
import AdminPageError from '@/components/admin/AdminPageError'
import ProdutoForm from '@/components/admin/ProdutoForm'
import type { Product, StoreSettings } from '@/types'

interface Props {
  params: { id: string }
}

export default async function EditarProdutoPage({ params }: Props) {
  const session = await getSessionSafe()
  if (!session) redirect('/admin')

  const { id } = params
  let product: Product
  let settings: StoreSettings

  try {
    const rows = await sql`
      SELECT * FROM products WHERE id = ${id} AND store_id = ${session.storeId} LIMIT 1
    `
    const found = rows[0] as Product | undefined
    if (!found) notFound()
    product = found

    const storeRows = await sql`SELECT settings_json FROM stores WHERE id = ${session.storeId} LIMIT 1`
    settings = (storeRows[0]?.settings_json as StoreSettings | null) ?? {}
  } catch (e) {
    console.error('[admin/produtos/edit]', id, e)
    return (
      <AdminPageError title="Editar produto">
        Não foi possível carregar o produto. Tente novamente em instantes.
      </AdminPageError>
    )
  }

  return (
    <div className="animate-fade-up max-w-2xl">
      <div className="mb-6">
        <h1 className="font-syne font-extrabold text-2xl mb-1">Editar produto</h1>
        <p className="text-sm text-muted">
          Altere nome, preço, estoque e variações. Gerencie as fotos por cor em cada cartão abaixo.
        </p>
      </div>
      <ProdutoForm
        storeId={session.storeId}
        productId={id}
        initialProduct={product}
        customCategories={settings.customCategories ?? []}
      />
    </div>
  )
}
