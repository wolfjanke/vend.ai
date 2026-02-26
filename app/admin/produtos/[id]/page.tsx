import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { sql } from '@/lib/db'
import ProdutoForm from '@/components/admin/ProdutoForm'
import type { Product } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarProdutoPage({ params }: Props) {
  const session = await getSession()
  if (!session) redirect('/admin')

  const { id } = await params
  const rows = await sql`
    SELECT * FROM products WHERE id = ${id} AND store_id = ${session.storeId} LIMIT 1
  `
  const product = rows[0] as Product | undefined
  if (!product) notFound()

  return (
    <div className="animate-fade-up max-w-2xl">
      <div className="mb-6">
        <h1 className="font-syne font-extrabold text-2xl mb-1">Editar produto</h1>
        <p className="text-sm text-muted">
          Altere nome, preço, estoque e variações. As fotos atuais são mantidas.
        </p>
      </div>
      <ProdutoForm storeId={session.storeId} productId={id} initialProduct={product} />
    </div>
  )
}
