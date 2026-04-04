'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteProduct } from '@/app/admin/actions'
import ConfirmDialog from '@/components/admin/ConfirmDialog'

interface Props {
  productId: string
  productName: string
}

export default function DeleteProductButton({ productId, productName }: Props) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  async function handleDelete() {
    setLoading(true)
    await deleteProduct(productId)
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={loading}
        className="text-xs py-2 px-3 min-h-[40px] border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1"
        title="Excluir produto"
      >
        <Trash2 size={14} aria-hidden />
        Excluir
      </button>
      <ConfirmDialog
        open={open}
        title="Excluir produto?"
        description={`O produto "${productName}" será removido permanentemente. Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={() => void handleDelete()}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}
