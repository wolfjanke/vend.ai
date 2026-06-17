'use client'

import ProdutoForm from '@/components/admin/ProdutoForm'
import { adminHeader } from '@/lib/admin-ui'
import type { CustomCategory } from '@/types'
import type { PlanSlug } from '@/lib/plans'

type Props = {
  storeId:              string
  customCategories:     CustomCategory[]
  plan:                 PlanSlug
  guidedFirstProduct:   boolean
  isFirstProduct:       boolean
}

export default function NovoProdutoClient({
  storeId,
  customCategories,
  plan,
  guidedFirstProduct,
  isFirstProduct,
}: Props) {
  return (
    <>
      <div className={adminHeader}>
        <h1 className="font-syne font-extrabold text-xl sm:text-2xl mb-1">
          {isFirstProduct ? 'Seu primeiro produto' : 'Novo produto'}
        </h1>
        <p className="text-sm text-muted break-words">
          {isFirstProduct
            ? 'Foto, preço e estoque — o mínimo para a Vi responder no Direct.'
            : 'Monte um bloco por produto — as fotos do bloco são as variações (cores, volumes). A IA analisa tudo e você revisa antes de publicar.'}
        </p>
      </div>
      <ProdutoForm
        storeId={storeId}
        customCategories={customCategories}
        plan={plan}
        guidedFirstProduct={guidedFirstProduct}
      />
    </>
  )
}
