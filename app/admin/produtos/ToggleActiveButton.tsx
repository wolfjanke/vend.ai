'use client'

import { Eye, EyeOff } from 'lucide-react'
import { toggleProductActive } from '@/app/admin/actions'

interface Props {
  productId: string
  active: boolean
}

export default function ToggleActiveButton({ productId, active }: Props) {
  const title = active ? 'Ocultar da vitrine' : 'Exibir na vitrine'
  return (
    <button
      type="button"
      onClick={() => toggleProductActive(productId, active)}
      title={title}
      aria-label={title}
      className={`text-xs py-2 px-3 min-h-[40px] border rounded-lg transition-all inline-flex items-center justify-center gap-1.5 ${
        active
          ? 'border-warm/30 text-warm hover:bg-warm/10'
          : 'border-accent/30 text-accent hover:bg-accent/10'
      }`}
    >
      {active ? <EyeOff size={14} aria-hidden /> : <Eye size={14} aria-hidden />}
      {active ? 'Ocultar' : 'Ativar'}
    </button>
  )
}
