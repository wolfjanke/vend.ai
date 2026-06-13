'use client'

import { useRef, useState } from 'react'
import { ImagePlus, Info, Tag } from 'lucide-react'
import type { CustomCategory } from '@/types'
import { PRODUCT_CATEGORIES } from '@/types'
import {
  addCustomCategory,
  removeCustomCategory,
  updateCategoryNavStyle,
  updateCustomCategory,
} from '@/app/admin/actions'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { stripEmojis } from '@/lib/strip-emoji'
import { getCategoryEmoji } from '@/lib/category-icons'

interface Props {
  customCategories: CustomCategory[]
  productCounts:    Record<string, number>
  categoryNavStyle: 'pills' | 'circles'
}

export default function CategoriesManager({
  customCategories: initial,
  productCounts: initialCounts,
  categoryNavStyle: initialNavStyle,
}: Props) {
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>(initial)
  const [productCounts, setProductCounts] = useState<Record<string, number>>(initialCounts)
  const [navStyle, setNavStyle] = useState<'pills' | 'circles'>(initialNavStyle)
  const [newLabel, setNewLabel] = useState('')
  const [newEmoji, setNewEmoji] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [removeValue, setRemoveValue] = useState<string | null>(null)
  const [removeLabel, setRemoveLabel] = useState('')
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

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
      const added = await addCustomCategory(trimmed, newEmoji || undefined)
      setCustomCategories(prev => [...prev, added])
      setProductCounts(prev => ({ ...prev, [added.value]: 0 }))
      setNewLabel('')
      setNewEmoji('')
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

  async function handleEmojiChange(value: string, emoji: string) {
    setError(null)
    setLoading(true)
    try {
      const updated = await updateCustomCategory(value, { emoji: emoji || null })
      setCustomCategories(prev => prev.map(c => (c.value === value ? updated : c)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar emoji')
    } finally {
      setLoading(false)
    }
  }

  async function handleImageUpload(value: string, file: File) {
    setError(null)
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('purpose', 'categoria')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Falha no upload')
      if (!data.url) throw new Error('URL da imagem não retornada')
      const updated = await updateCustomCategory(value, { imageUrl: data.url })
      setCustomCategories(prev => prev.map(c => (c.value === value ? updated : c)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no upload')
    } finally {
      setLoading(false)
    }
  }

  async function handleRemoveImage(value: string) {
    setError(null)
    setLoading(true)
    try {
      const updated = await updateCustomCategory(value, { imageUrl: null })
      setCustomCategories(prev => prev.map(c => (c.value === value ? updated : c)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover imagem')
    } finally {
      setLoading(false)
    }
  }

  async function handleNavStyleChange(style: 'pills' | 'circles') {
    if (style === navStyle) return
    setError(null)
    setLoading(true)
    try {
      await updateCategoryNavStyle(style)
      setNavStyle(style)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar estilo')
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
        <h2 className="font-syne font-bold text-sm text-foreground mb-1">Barra de categorias na vitrine</h2>
        <p className="text-xs text-muted mb-4 break-words">
          Escolha como os filtros aparecem no celular: chips compactos ou ícones circulares (estilo stories).
        </p>
        <div className="flex flex-wrap gap-2">
          {(['pills', 'circles'] as const).map(style => (
            <button
              key={style}
              type="button"
              disabled={loading}
              onClick={() => void handleNavStyleChange(style)}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                navStyle === style
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted hover:border-primary/40'
              }`}
            >
              {style === 'pills' ? 'Chips' : 'Círculos'}
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
                  <span className="text-base shrink-0" aria-hidden>
                    {getCategoryEmoji(c.value, c.label)}
                  </span>
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
            Use para perfumaria, relógios, bolsas e outros itens. Emoji e imagem são opcionais na vitrine.
            Emojis não são permitidos nos nomes.
          </p>

          <form onSubmit={handleAdd} className="flex flex-col gap-2 mb-6">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={newLabel}
                  onChange={e => {
                    setNewLabel(stripEmojis(e.target.value))
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
              </div>
              <input
                type="text"
                value={newEmoji}
                onChange={e => setNewEmoji(e.target.value.slice(0, 4))}
                placeholder="Emoji"
                className="w-full sm:w-20 min-h-[44px] px-3 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm text-center outline-none focus:border-primary"
                maxLength={4}
                disabled={loading}
                aria-label="Emoji opcional"
              />
              <button
                type="submit"
                disabled={loading || !newLabel.trim()}
                className="shrink-0 min-h-[44px] px-4 py-2.5 rounded-xl border border-primary bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '…' : '+ Adicionar'}
              </button>
            </div>
            {fieldError && <p className="text-xs text-warm">{fieldError}</p>}
          </form>

          {customCategories.length === 0 ? (
            <div className="text-center py-10 px-4 border border-dashed border-border rounded-xl">
              <Tag className="w-10 h-10 mx-auto mb-3 text-muted opacity-60" aria-hidden />
              <p className="text-sm font-medium text-foreground mb-1">Nenhuma categoria extra ainda</p>
              <p className="text-xs text-muted">Adicione acima para organizar seu catálogo do seu jeito.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {customCategories.map(c => (
                <li
                  key={c.value}
                  className="flex flex-col gap-3 min-w-0 py-3 border-b border-border/60 last:border-0"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 min-w-0">
                    <div className="min-w-0 flex-1 flex items-start gap-3">
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => fileInputRefs.current[c.value]?.click()}
                        className="relative w-12 h-12 shrink-0 rounded-full border border-border bg-surface2 flex items-center justify-center overflow-hidden hover:border-primary/50 transition-colors"
                        title="Enviar imagem da categoria"
                      >
                        {c.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ImagePlus size={18} className="text-muted" aria-hidden />
                        )}
                      </button>
                      <input
                        ref={el => { fileInputRefs.current[c.value] = el }}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (file) void handleImageUpload(c.value, file)
                          e.target.value = ''
                        }}
                      />
                      <div className="min-w-0">
                        <div className="text-sm text-foreground break-words">{c.label}</div>
                        <div className="text-[11px] text-muted font-mono break-all">{c.value}</div>
                      </div>
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
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pl-[3.75rem]">
                    <label className="text-xs text-muted shrink-0">Emoji</label>
                    <input
                      type="text"
                      defaultValue={c.emoji ?? ''}
                      placeholder="🏷️"
                      maxLength={4}
                      disabled={loading}
                      className="w-16 min-h-[40px] px-2 py-1.5 bg-surface2 border border-border rounded-lg text-sm text-center outline-none focus:border-primary"
                      onBlur={e => {
                        const next = e.target.value.trim()
                        if (next === (c.emoji ?? '')) return
                        void handleEmojiChange(c.value, next)
                      }}
                    />
                    {c.imageUrl && (
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => void handleRemoveImage(c.value)}
                        className="text-xs py-2 px-3 min-h-[40px] border border-border text-muted rounded-lg hover:bg-surface2 transition-all"
                      >
                        Remover imagem
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

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
