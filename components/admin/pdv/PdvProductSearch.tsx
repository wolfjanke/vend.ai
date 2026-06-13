'use client'

import type { Product } from '@/types'
import { formatPdvCurrency } from './pdv-utils'
import PdvProductThumb from './PdvProductThumb'

interface Props {
  search:           string
  onSearchChange:   (v: string) => void
  products:         Product[]
  onChooseProduct:  (p: Product) => void
}

export default function PdvProductSearch({
  search,
  onSearchChange,
  products,
  onChooseProduct,
}: Props) {
  const queryLen = search.trim().length
  const showEmptyHint = queryLen < 2
  const showNoResults = queryLen >= 2 && products.length === 0

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 xl:col-span-7 flex flex-col min-h-[280px] xl:min-h-[50vh] overflow-hidden min-w-0">
      <div className="font-syne font-bold text-sm mb-3 shrink-0">Adicionar produtos</div>

      <div className="sticky top-0 z-10 bg-surface pb-3 shrink-0">
        <input
          className="w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-sm outline-none focus:border-primary transition-all"
          placeholder="Buscar produto por nome…"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
        {showEmptyHint && (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <p className="text-muted text-sm break-words max-w-xs">
              Digite ao menos <strong className="text-foreground font-medium">2 letras</strong> do produto para buscar.
            </p>
          </div>
        )}

        {showNoResults && (
          <p className="text-center text-muted text-sm py-8 break-words">Nenhum produto encontrado</p>
        )}

        {!showEmptyHint && products.map(p => (
          <div
            key={p.id}
            className="bg-surface2 border border-border rounded-xl p-3 flex items-center gap-3 min-w-0"
          >
            <PdvProductThumb product={p} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate" title={p.name}>{p.name}</div>
              <div className="text-accent text-sm tabular-nums">{formatPdvCurrency(Number(p.price))}</div>
            </div>
            <button
              type="button"
              onClick={() => onChooseProduct(p)}
              className="shrink-0 min-h-[44px] px-4 py-2 bg-primary/10 border border-primary/40 text-primary text-sm font-semibold rounded-xl hover:bg-primary/20 transition-colors"
            >
              Escolher
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
