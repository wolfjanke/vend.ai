'use client'

import { useState } from 'react'
import { deleteProduct } from '@/app/admin/actions'

interface Props {
  productId: string
  productName: string
}

export default function DeleteProductButton({ productId, productName }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    const confirmed = window.confirm(
      `Excluir "${productName}" permanentemente?\n\nEssa ação não pode ser desfeita.`
    )
    if (!confirmed) return
    setLoading(true)
    await deleteProduct(productId)
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs py-2 px-3 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      title="Excluir produto"
    >
      {loading ? '...' : 'Excluir'}
    </button>
  )
}
