'use client'

import { useState, useMemo } from 'react'
import type { Product, CartItem } from '@/types'
import ProdutoCard from './ProdutoCard'
import { PRODUCT_CATEGORIES } from '@/types'

interface Props {
  products:    Product[]
  onAddToCart: (item: CartItem) => void
  onInteract?: () => void
}

const ALL_FILTERS = [
  { value: '',     label: 'Tudo' },
  ...PRODUCT_CATEGORIES,
  { value: 'sale', label: '🔥 Promoções' },
]

export default function Catalogo({ products, onAddToCart, onInteract }: Props) {
  const [search,  setSearch]  = useState('')
  const [catFilter, setCatFilter] = useState('')

  const filtered = useMemo(() => {
    let list = products
    if (catFilter === 'sale') {
      list = list.filter(p => p.promo_price !== null)
    } else if (catFilter) {
      list = list.filter(p => p.category === catFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.category.includes(q) || p.description.toLowerCase().includes(q))
    }
    return list
  }, [products, catFilter, search])

  return (
    <div>
      {/* Search */}
      <div className="relative z-10 px-4 md:px-6 pt-8 pb-0 animate-fade-up">
        <div className="max-w-2xl mx-auto relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); onInteract?.() }}
            className="w-full pl-11 pr-4 py-3.5 bg-surface border border-border rounded-2xl text-foreground text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-dim)] transition-all placeholder:text-muted"
            placeholder="Descreva o que procura… Ex: vestido floral para festa, tamanho M"
          />
        </div>
      </div>

      {/* Category filters */}
      <div className="relative z-10 px-4 md:px-6 pt-5 pb-0" style={{ animationDelay: '0.2s' }}>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {ALL_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => { setCatFilter(f.value); onInteract?.() }}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full border text-sm font-medium transition-all whitespace-nowrap ${
                catFilter === f.value
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-surface border-border text-muted hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 pt-7 pb-4">
        <h2 className="font-syne font-bold text-lg">Novidades</h2>
        <span className="text-sm text-muted">{filtered.length} {filtered.length === 1 ? 'peça' : 'peças'}</span>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 px-4 md:px-6 pb-32">
          {filtered.map((p, i) => (
            <div key={p.id} className="animate-fade-up" style={{ animationDelay: `${(i % 8) * 0.05}s` }}>
              <ProdutoCard product={p} onAddToCart={onAddToCart} onInteract={onInteract} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted px-6">
          <div className="text-5xl mb-3">🔍</div>
          <p className="font-medium">Nenhum produto encontrado</p>
          <p className="text-sm mt-1">Tente outro termo ou categoria</p>
        </div>
      )}
    </div>
  )
}
