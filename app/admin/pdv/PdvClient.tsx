'use client'

import { useState } from 'react'
import type { Product } from '@/types'
import PdvSale      from '@/components/admin/pdv/PdvSale'
import PdvHistory   from '@/components/admin/pdv/PdvHistory'

interface Props {
  storeId:       string
  products:      Product[]
  storeHasAsaas: boolean
  storeWhatsapp: string
}

type Tab = 'venda' | 'historico'

export default function PdvClient({ storeId, products, storeHasAsaas, storeWhatsapp }: Props) {
  const [tab, setTab] = useState<Tab>('venda')

  return (
    <div>
      <div className="flex gap-2 mb-5">
        {(['venda', 'historico'] as Tab[]).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 min-h-[44px] rounded-xl text-sm font-semibold transition-all ${
              tab === t ? 'bg-primary text-white' : 'border border-border text-muted hover:text-foreground hover:border-primary/50'
            }`}
          >
            {t === 'venda' ? '🛒 Nova venda' : '📋 Histórico'}
          </button>
        ))}
      </div>

      {tab === 'venda' ? (
        <PdvSale
          storeId={storeId}
          products={products}
          storeHasAsaas={storeHasAsaas}
          storeWhatsapp={storeWhatsapp}
        />
      ) : (
        <PdvHistory storeId={storeId} />
      )}
    </div>
  )
}
