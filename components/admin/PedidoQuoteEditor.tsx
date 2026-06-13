'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Gift, Loader2, Plus, Trash2 } from 'lucide-react'
import type { OrderItem, Product, ProductVariant } from '@/types'
import { getActiveProductsCatalog } from '@/app/admin/actions'
import { normalizeOrderItems } from '@/lib/orders'
import { resolveSkuUnitPrice } from '@/lib/product-pricing'
import PdvVariantPicker from '@/components/admin/pdv/PdvVariantPicker'
import { formatPdvCurrency } from '@/components/admin/pdv/pdv-utils'

interface Props {
  orderId: string
  initialItems: OrderItem[]
  initialNotes: string
  onSaved: (items: OrderItem[], notes: string, total: number) => void
  onCancel: () => void
}

function calcItemsSubtotal(items: OrderItem[]): number {
  return Math.max(0, Number(items.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2)))
}

function parsePriceInput(raw: string): number {
  const n = parseFloat(raw.replace(',', '.'))
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.round(n * 100) / 100
}

export default function PedidoQuoteEditor({
  orderId,
  initialItems,
  initialNotes,
  onSaved,
  onCancel,
}: Props) {
  const router = useRouter()
  const [items, setItems] = useState<OrderItem[]>(() => normalizeOrderItems(initialItems))
  const [notes, setNotes] = useState(initialNotes)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [catalog, setCatalog] = useState<Product[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [pickerProduct, setPickerProduct] = useState<Product | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const products = await getActiveProductsCatalog()
        if (!cancelled) setCatalog(products)
      } catch {
        if (!cancelled) setError('Não foi possível carregar o catálogo.')
      } finally {
        if (!cancelled) setCatalogLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (q.length < 2) return []
    return catalog.filter(p => p.name.toLowerCase().includes(q)).slice(0, 8)
  }, [search, catalog])

  function updateQty(index: number, qty: number) {
    setItems(prev => prev.map((item, i) => (i === index ? { ...item, qty: Math.max(1, qty) } : item)))
  }

  function updatePrice(index: number, price: number) {
    setItems(prev => prev.map((item, i) => (i === index ? { ...item, price } : item)))
  }

  function removeLine(index: number) {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  function addProductLine(product: Product, variant: ProductVariant, size: string, price?: number) {
    const unitPrice = price ?? resolveSkuUnitPrice(product, variant, size)
    setItems(prev => {
      const idx = prev.findIndex(
        i => i.product_id === product.id && i.variant_id === variant.id && i.size === size,
      )
      if (idx >= 0) {
        return prev.map((item, i) => (i === idx ? { ...item, qty: item.qty + 1 } : item))
      }
      return [
        ...prev,
        {
          product_id: product.id,
          variant_id: variant.id,
          name:       product.name,
          size,
          color:      variant.color,
          qty:        1,
          price:      unitPrice,
          photo:      variant.photos?.[0],
        },
      ]
    })
    setSearch('')
  }

  async function save() {
    if (items.length === 0) {
      setError('O orçamento precisa ter pelo menos um item.')
      return
    }
    setLoading(true)
    setError(null)
    const payload = normalizeOrderItems(items)
    try {
      const res = await fetch(`/api/admin/pedidos/${orderId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ items: payload, notes }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'Não foi possível salvar.')
        return
      }
      onSaved(payload, notes, Number(data.total ?? calcItemsSubtotal(payload)))
      router.refresh()
    } catch {
      setError('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  const itemsSubtotal = calcItemsSubtotal(items)

  return (
    <div className="mb-3 p-3 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
      <p className="text-xs font-semibold text-foreground">Editar orçamento</p>
      <p className="text-[11px] text-muted leading-relaxed">
        Adicione produtos ou brindes, ajuste quantidades e preços antes de confirmar o pagamento.
      </p>

      <div className="rounded-xl border border-border bg-surface2/60 p-3 space-y-2">
        <p className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
          <Plus size={13} aria-hidden />
          Adicionar produto
        </p>
        <input
          type="search"
          className="w-full min-h-[44px] px-3 py-2.5 bg-surface border border-border rounded-xl text-sm outline-none focus:border-primary"
          placeholder="Buscar no catálogo (mín. 2 letras)…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoComplete="off"
        />
        {catalogLoading && (
          <p className="text-[11px] text-muted flex items-center gap-1.5">
            <Loader2 size={12} className="animate-spin" aria-hidden />
            Carregando catálogo…
          </p>
        )}
        {search.trim().length >= 2 && !catalogLoading && filtered.length === 0 && (
          <p className="text-[11px] text-muted">Nenhum produto encontrado.</p>
        )}
        {filtered.length > 0 && (
          <div className="space-y-1.5 max-h-44 overflow-y-auto">
            {filtered.map(p => (
              <div
                key={p.id}
                className="flex items-center gap-2 min-w-0 p-2 rounded-lg border border-border bg-surface"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" title={p.name}>{p.name}</p>
                  <p className="text-[10px] text-accent tabular-nums">{formatPdvCurrency(Number(p.price))}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPickerProduct(p)}
                  className="shrink-0 min-h-[40px] px-3 rounded-lg border border-primary/40 text-primary text-xs font-semibold hover:bg-primary/10"
                >
                  Escolher
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={`${item.product_id}-${item.variant_id}-${item.size}-${index}`}
            className="p-2.5 rounded-xl border border-border bg-surface/80 space-y-2"
          >
            <div className="flex gap-2 items-start min-w-0">
              <div className="flex-1 min-w-0 text-xs text-muted break-words">
                {item.name}
                {item.color ? ` — ${item.color}` : ''} · {item.size}
              </div>
              <button
                type="button"
                onClick={() => removeLine(index)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg border border-warm/30 text-warm hover:bg-warm/10 shrink-0"
                aria-label="Remover item"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-[10px] text-muted">
                Qtd
                <input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  className="mt-0.5 block w-14 min-h-[40px] px-2 py-1.5 bg-surface2 border border-border rounded-lg text-sm text-center"
                  value={item.qty}
                  onChange={e => updateQty(index, parseInt(e.target.value, 10) || 1)}
                />
              </label>
              <label className="text-[10px] text-muted flex-1 min-w-[5rem]">
                Preço un. (R$)
                <input
                  type="text"
                  inputMode="decimal"
                  className="mt-0.5 block w-full min-h-[40px] px-2 py-1.5 bg-surface2 border border-border rounded-lg text-sm tabular-nums"
                  value={item.price.toFixed(2).replace('.', ',')}
                  onChange={e => updatePrice(index, parsePriceInput(e.target.value))}
                />
              </label>
              <button
                type="button"
                onClick={() => updatePrice(index, 0)}
                className={`min-h-[40px] px-2.5 rounded-lg border text-[10px] font-semibold inline-flex items-center gap-1 ${
                  item.price === 0
                    ? 'border-accent/50 text-accent bg-accent/10'
                    : 'border-border text-muted hover:text-foreground hover:border-accent/30'
                }`}
              >
                <Gift size={12} aria-hidden />
                Brinde
              </button>
            </div>
            <p className="text-[10px] text-muted tabular-nums">
              Linha: R${(item.price * item.qty).toFixed(2).replace('.', ',')}
            </p>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <p className="text-xs text-warm">Nenhum item — busque e adicione pelo menos um produto.</p>
      )}

      <textarea
        className="w-full min-h-[72px] px-3 py-2.5 bg-surface2 border border-border rounded-xl text-sm resize-y"
        placeholder="Observações do orçamento"
        value={notes}
        onChange={e => setNotes(e.target.value)}
      />

      <div className="space-y-1 text-sm tabular-nums">
        <div className="flex items-center justify-between font-semibold">
          <span className="text-muted">Subtotal dos itens</span>
          <span className="text-accent">R${itemsSubtotal.toFixed(2).replace('.', ',')}</span>
        </div>
        <p className="text-[10px] text-muted leading-relaxed">
          Frete e descontos do pedido são mantidos ao salvar.
        </p>
      </div>

      {error && <p className="text-xs text-warm break-words">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-3 py-2 min-h-[40px] rounded-lg border border-border text-xs font-semibold text-muted hover:text-foreground disabled:opacity-50"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={save}
          disabled={loading || items.length === 0}
          className="px-3 py-2 min-h-[40px] rounded-lg border border-primary text-primary text-xs font-semibold hover:bg-primary/20 disabled:opacity-50 inline-flex items-center gap-1.5"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : null}
          Salvar orçamento
        </button>
      </div>

      <PdvVariantPicker
        product={pickerProduct}
        onClose={() => setPickerProduct(null)}
        onSelect={(variant, size) => {
          if (pickerProduct) addProductLine(pickerProduct, variant, size)
        }}
      />
    </div>
  )
}
