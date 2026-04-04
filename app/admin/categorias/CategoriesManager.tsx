'use client'

import { useState } from 'react'
import { Info, Tag } from 'lucide-react'
import type { CustomCategory } from '@/types'
import { PRODUCT_CATEGORIES } from '@/types'
import { addCustomCategory, removeCustomCategory } from '@/app/admin/actions'
import ConfirmDialog from '@/components/admin/ConfirmDialog'

interface Props {
  customCategories: CustomCategory[]
  productCounts: Record<string, number>
}

export default function CategoriesManager({ customCategories: initial, productCounts: initialCounts }: Props) {
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>(initial)
  const [productCounts, setProductCounts] = useState<Record<string, number>>(initialCounts)
  const [newLabel, setNewLabel] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [removeValue, setRemoveValue] = useState<string | null>(null)
  const [removeLabel, setRemoveLabel] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldError(null)
    const trimmed = newLabel.trim()
    if (trimmed.length < 2) {
      setFieldError('Use pelo menos 2 caracteres.')
      return
    }
    if (customCategories.some(c => c.label.toLowerCase() === trimmed.toLowerCase())) {
      setFieldError('Já existe uma categoria com esse nome.')
      return
    }
    setLoading(true)
    try {
      const added = await addCustomCategory(newLabel)
      setCustomCategories(prev => [...prev, added])
      setProductCounts(prev => ({ ...prev, [added.value]: 0 }))
      setNewLabel('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar')
    } finally {
      setLoading(false)
    }
  }

  async function confirmRemove() {
    if (!removeValue) return
    setError(null)
    setLoading(true)
    try {
      await removeCustomCategory(removeValue)
      setCustomCategories(prev => prev.filter(c => c.value !== removeValue))
      setProductCounts(prev => {
        const next = { ...prev }
        delete next[removeValue]
        return next
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover')
    } finally {
      setLoading(false)
      setRemoveValue(null)
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
        <div className="flex items-start gap-2 mb-4">
          <h2 className="font-syne font-bold text-sm text-foreground">Categorias padrão</h2>
          <span
            className="inline-flex text-muted"
            title="Estas categorias são fixas e não podem ser removidas."
          >
            <Info size={16} className="shrink-0 mt-0.5" aria-hidden />
          </span>
        </div>
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
        <div className="flex items-start gap-2 mb-4">
          <h2 className="font-syne font-bold text-sm text-foreground">Categorias da sua loja</h2>
          <span
            className="inline-flex text-muted"
            title="Crie categorias específicas do seu negócio: Festa, Praia, Básico, etc."
          >
            <Info size={16} className="shrink-0 mt-0.5" aria-hidden />
          </span>
        </div>
        <p className="text-xs text-muted mb-4 break-words">
          Use para perfumaria, relógios, bolsas e outros itens além do vestuário. Elas aparecem no cadastro de produto e
          na análise por IA.
        </p>

        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2 mb-6">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={newLabel}
              onChange={e => {
                setNewLabel(e.target.value)
                setFieldError(null)
              }}
              placeholder="Ex: Perfumes, Relógios"
              className={`w-full min-h-[44px] px-4 py-2.5 bg-surface2 border rounded-xl text-foreground text-sm outline-none focus:border-primary transition-all ${
                fieldError ? 'border-warm' : 'border-border'
              }`}
              maxLength={80}
              disabled={loading}
              aria-invalid={Boolean(fieldError)}
            />
            {fieldError && <p className="text-xs text-warm mt-1">{fieldError}</p>}
          </div>
          <button
            type="submit"
            disabled={loading || !newLabel.trim()}
            className="shrink-0 min-h-[44px] px-4 py-2.5 rounded-xl border border-primary bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '…' : '+ Adicionar'}
          </button>
        </form>

        {customCategories.length === 0 ? (
          <div className="text-center py-10 px-4 border border-dashed border-border rounded-xl">
            <Tag className="w-10 h-10 mx-auto mb-3 text-muted opacity-60" aria-hidden />
            <p className="text-sm font-medium text-foreground mb-1">Nenhuma categoria extra ainda</p>
            <p className="text-xs text-muted">Adicione acima para organizar seu catálogo do seu jeito.</p>
          </div>
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
                    onClick={() => {
                      setRemoveValue(c.value)
                      setRemoveLabel(c.label)
                    }}
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

      <ConfirmDialog
        open={removeValue !== null}
        title="Remover categoria?"
        description={`A categoria "${removeLabel}" sai da lista. Os produtos já cadastrados nela não são apagados, mas podem perder o vínculo com este rótulo — edite cada produto se precisar.`}
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={() => void confirmRemove()}
        onCancel={() => setRemoveValue(null)}
      />
    </div>
  )
}
