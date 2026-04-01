'use client'

import { useState } from 'react'
import type { CustomCategory } from '@/types'
import { PRODUCT_CATEGORIES } from '@/types'
import { addCustomCategory, removeCustomCategory } from '@/app/admin/actions'

interface Props {
  customCategories: CustomCategory[]
  productCounts: Record<string, number>
}

export default function CategoriesManager({ customCategories: initial, productCounts }: Props) {
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>(initial)
  const [newLabel, setNewLabel] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await addCustomCategory(newLabel)
      setNewLabel('')
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar')
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove(value: string) {
    if (!window.confirm('Remover esta categoria da lista? Os produtos já cadastrados nela mantêm o mesmo tipo; você pode editar cada produto se precisar.')) {
      return
    }
    setError(null)
    setLoading(true)
    try {
      await removeCustomCategory(value)
      setCustomCategories(prev => prev.filter(c => c.value !== value))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="text-sm text-warm border border-warm/30 rounded-xl px-4 py-3 break-words" role="alert">
          {error}
        </div>
      )}

      <section className="bg-surface border border-border rounded-2xl p-5">
        <h2 className="font-syne font-bold text-sm mb-4 text-foreground">Categorias padrão</h2>
        <p className="text-xs text-muted mb-4 break-words">
          Sempre disponíveis no cadastro de produto. A contagem reflete produtos ativos e inativos.
        </p>
        <ul className="space-y-2">
          {PRODUCT_CATEGORIES.map(c => (
            <li
              key={c.value}
              className="flex flex-wrap items-center justify-between gap-2 gap-y-2 min-w-0 py-2 border-b border-border/60 last:border-0"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted shrink-0">Padrão</span>
                <span className="text-sm text-foreground break-words min-w-0">{c.label}</span>
              </div>
              <span className="text-xs tabular-nums text-muted shrink-0">{productCounts[c.value] ?? 0} prod.</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-5">
        <h2 className="font-syne font-bold text-sm mb-4 text-foreground">Categorias da sua loja</h2>
        <p className="text-xs text-muted mb-4 break-words">
          Use para perfumaria, relógios, bolsas e outros itens além do vestuário. Elas aparecem no cadastro de
          produto e na análise por IA.
        </p>

        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2 mb-6">
          <input
            type="text"
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            placeholder="Ex: Perfumes, Relógios"
            className="flex-1 min-w-0 min-h-[44px] px-4 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary transition-all"
            maxLength={80}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !newLabel.trim()}
            className="shrink-0 min-h-[44px] px-4 py-2.5 rounded-xl border border-primary bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '…' : '+ Adicionar'}
          </button>
        </form>

        {customCategories.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma categoria extra ainda.</p>
        ) : (
          <ul className="space-y-2">
            {customCategories.map(c => (
              <li
                key={c.value}
                className="flex flex-wrap items-center justify-between gap-2 gap-y-2 min-w-0 py-2 border-b border-border/60 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-foreground break-words">{c.label}</div>
                  <div className="text-[11px] text-muted font-mono break-all">{c.value}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs tabular-nums text-muted">{productCounts[c.value] ?? 0} prod.</span>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleRemove(c.value)}
                    className="text-xs py-2 px-3 min-h-[40px] border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-all disabled:opacity-50"
                  >
                    Excluir
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
