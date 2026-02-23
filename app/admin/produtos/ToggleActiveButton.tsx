'use client'

import { toggleProductActive } from '@/app/admin/actions'

interface Props {
  productId: string
  active:    boolean
}

export default function ToggleActiveButton({ productId, active }: Props) {
  return (
    <button
      onClick={() => toggleProductActive(productId, active)}
      className={`text-xs py-2 px-3 border rounded-lg transition-all ${
        active
          ? 'border-warm/30 text-warm hover:bg-warm/10'
          : 'border-accent/30 text-accent hover:bg-accent/10'
      }`}
    >
      {active ? 'Ocultar' : 'Ativar'}
    </button>
  )
}
