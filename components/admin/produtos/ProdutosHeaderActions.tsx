'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import type { StockAlertsConfig } from '@/types'
import StockAlertsDialog from '@/components/admin/StockAlertsDialog'

interface Props {
  stockAlerts: StockAlertsConfig
}

export default function ProdutosHeaderActions({ stockAlerts }: Props) {
  return (
    <div className="flex gap-2 w-full sm:w-auto shrink-0 min-w-0">
      <StockAlertsDialog initial={stockAlerts} />
      <Link
        href="/admin/produtos/novo"
        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-primary/10 border border-primary rounded-xl text-primary text-sm font-semibold hover:bg-primary/20 transition-all"
      >
        <Plus size={18} aria-hidden />
        Novo produto
      </Link>
    </div>
  )
}
