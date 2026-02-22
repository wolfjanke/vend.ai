'use client'

import { useState, useRef } from 'react'
import { useRouter }         from 'next/navigation'
import { createBrowser }     from '@/lib/supabase'
import type { ProductVariant } from '@/types'
import { PRODUCT_CATEGORIES, SIZES } from '@/types'

interface Props { storeId: string }

interface VariantState {
  id:       string
  color:    string
  colorHex: string
  photos:   File[]
  stock:    Record<string, number>
}

export default function ProdutoForm({ storeId }: Props) {
  const router   = useRouter()
  const supabase = createBrowser()
  const fileRef  = useRef<HTMLInputElement>(null)

  const [files,       setFiles]       = useState<File[]>([])
  const [previews,    setPreviews]    = useState<string[]>([])
  const [analyzing,   setAnalyzing]   = useState(false)
  const [aiStatus,    setAiStatus]    = useState('')
  const [analyzed,    setAnalyzed]    = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [active,      setActive]      = useState(true)

  const [prodName,    setProdName]    = useState('')
  const [prodDesc,    setProdDesc]    = useState('')
  const [prodCat,     setProdCat]     = useState('')
  const [prodPrice,   setProdPrice]   = useState('')
  const [prodPromo,   setProdPromo]   = useState('')
  const [variants,    setVariants]    = useState<VariantState[]>([])

  const [aiBadges, setAiBadges] = useState({ name: false, desc: false, cat: false })

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return
    const newFiles = Array.from(e.target.files)
    setFiles(prev => [...prev, ...newFiles])
    newFiles.forEach(f => {
      const reader = new FileReader()
      reader.onload = ev => setPreviews(prev => [...prev, ev.target?.result as string])
      reader.readAsDataURL(f)
    })
  }

  async function analyzeWithAI() {
    if (!previews.length) return
    setAnalyzing(true)
    setAiStatus('Carregando imagens…')

    const steps = [
      [600,  'Identificando a peça…'],
      [1500, 'Detectando variações de cor…'],
      [2500, 'Gerando nome e descrição…'],
    ]
    steps.forEach(([t, msg]) => setTimeout(() => setAiStatus(msg as string), t as number))

    try {
      const res = await fetch('/api/produtos/analyze', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ images: previews.slice(0, 10) }),
      })
      const data = await res.json()

      setProdName(data.nome ?? '')
      setProdDesc(data.descricao ?? '')
      setProdCat(data.categoria ?? '')
      setAiBadges({ name: true, desc: true, cat: true })

      const generatedVariants: VariantState[] = (data.variantes ?? []).map((v: { cor: string; corHex: string }, i: number) => ({
        id:       crypto.randomUUID(),
        color:    v.cor,
        colorHex: v.corHex ?? '#888888',
        photos:   i === 0 ? files.slice(0, Math.ceil(files.length / (data.variantes?.length ?? 1))) : [],
        stock:    Object.fromEntries(SIZES.map(s => [s, 0])),
      }))

      if (generatedVariants.length === 0) {
        generatedVariants.push({
          id:       crypto.randomUUID(),
          color:    'Único',
          colorHex: '#888888',
          photos:   files,
          stock:    Object.fromEntries(SIZES.map(s => [s, 0])),
        })
      }

      setVariants(generatedVariants)
      setAnalyzed(true)
      setAiStatus(`✓ ${generatedVariants.length} variação${generatedVariants.length > 1 ? 'ões' : ''} identificada${generatedVariants.length > 1 ? 's' : ''}`)
    } catch {
      setAiStatus('Erro na análise — preencha manualmente')
      setAnalyzed(true)
    } finally {
      setAnalyzing(false)
    }
  }

  function addVariant() {
    setVariants(prev => [...prev, {
      id:       crypto.randomUUID(),
      color:    'Nova Cor',
      colorHex: '#888888',
      photos:   [],
      stock:    Object.fromEntries(SIZES.map(s => [s, 0])),
    }])
  }

  function removeVariant(id: string) {
    setVariants(prev => prev.filter(v => v.id !== id))
  }

  function updateVariant(id: string, patch: Partial<VariantState>) {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, ...patch } : v))
  }

  function updateStock(variantId: string, size: string, qty: number) {
    setVariants(prev => prev.map(v => v.id === variantId ? { ...v, stock: { ...v.stock, [size]: qty } } : v))
  }

  async function uploadPhoto(file: File, path: string) {
    const { data, error } = await supabase.storage.from('product-photos').upload(path, file, { upsert: true })
    if (error) throw error
    const { data: urlData } = supabase.storage.from('product-photos').getPublicUrl(data.path)
    return urlData.publicUrl
  }

  async function handleSave() {
    if (!prodName.trim()) { alert('Informe o nome do produto'); return }
    if (!prodPrice)       { alert('Informe o preço'); return }
    if (!variants.length) { alert('Adicione ao menos uma variação'); return }
    setSaving(true)

    try {
      const finalVariants: ProductVariant[] = await Promise.all(
        variants.map(async v => {
          const photoUrls = await Promise.all(
            v.photos.map((file, i) =>
              uploadPhoto(file, `${storeId}/${Date.now()}_${i}_${file.name}`)
            )
          )
          return {
            id:       v.id,
            color:    v.color,
            colorHex: v.colorHex,
            photos:   photoUrls,
            stock:    v.stock,
          }
        })
      )

      const { error } = await supabase.from('products').insert({
        store_id:      storeId,
        name:          prodName.trim(),
        description:   prodDesc.trim(),
        category:      prodCat,
        price:         parseFloat(prodPrice),
        promo_price:   prodPromo ? parseFloat(prodPromo) : null,
        variants_json: finalVariants,
        active,
      })

      if (error) throw error
      router.push('/admin/produtos')
      router.refresh()
    } catch (e) {
      alert(`Erro ao salvar: ${e instanceof Error ? e.message : e}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* Upload Zone */}
      <div
        className={`border-2 border-dashed rounded-2xl transition-all cursor-pointer mb-4 ${files.length ? 'border-border' : 'border-border hover:border-primary hover:bg-primary/5'}`}
        onClick={() => !files.length && fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
            <div className="text-5xl mb-3">🖼️</div>
            <div className="font-syne font-semibold text-sm mb-1">Selecionar fotos da galeria</div>
            <div className="text-xs text-muted mb-4">Selecione várias fotos — a IA vai agrupar por cor</div>
            <div className="px-4 py-2 bg-primary/10 border border-primary rounded-xl text-primary text-xs font-semibold">📂 Abrir galeria</div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5 p-4 cursor-default">
            {previews.map((src, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border">
                <img src={src} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Analyze bar */}
      {files.length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-3 p-4 bg-surface border border-border rounded-2xl mb-4">
          <div>
            <div className="font-semibold text-sm">{files.length} foto{files.length > 1 ? 's' : ''} selecionada{files.length > 1 ? 's' : ''}</div>
            {aiStatus && (
              <div className={`text-xs mt-0.5 ${analyzed ? 'text-accent' : 'text-primary'}`}>{aiStatus}</div>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => fileRef.current?.click()} className="px-3.5 py-2 border border-border rounded-xl text-muted text-xs hover:text-foreground transition-all">+ Adicionar</button>
            <button onClick={analyzeWithAI} disabled={analyzing} className="flex items-center gap-1.5 px-4 py-2 bg-grad text-bg font-syne font-bold text-xs rounded-xl hover:shadow-[0_4px_20px_var(--primary-glow)] transition-all disabled:opacity-70 disabled:cursor-wait">
              {analyzing ? '⏳ Analisando…' : '✦ Analisar com IA'}
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {analyzed && (
        <>
          {/* Product info */}
          <div className="bg-surface border border-border rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-4 font-syne font-bold text-sm">
              Informações do Produto
              <span className="text-primary bg-primary/10 border border-primary/30 rounded-full px-2.5 py-0.5 text-[11px] font-medium">✦ Preenchido pela IA</span>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">Nome</label>
                <input className="w-full px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary transition-all" value={prodName} onChange={e => { setProdName(e.target.value); setAiBadges(p => ({ ...p, name: false })) }} />
                {aiBadges.name && <span className="text-[11px] text-primary mt-1 block">✦ Sugerido pela IA</span>}
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">Descrição</label>
                <textarea className="w-full px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary transition-all min-h-[80px] resize-y" value={prodDesc} onChange={e => { setProdDesc(e.target.value); setAiBadges(p => ({ ...p, desc: false })) }} />
                {aiBadges.desc && <span className="text-[11px] text-primary mt-1 block">✦ Sugerido pela IA</span>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">Categoria</label>
                  <select className="w-full px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary transition-all appearance-none" value={prodCat} onChange={e => { setProdCat(e.target.value); setAiBadges(p => ({ ...p, cat: false })) }}>
                    <option value="">Selecionar…</option>
                    {PRODUCT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  {aiBadges.cat && <span className="text-[11px] text-primary mt-1 block">✦ Sugerido pela IA</span>}
                </div>

                <div>
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">Preço (R$)</label>
                  <input type="number" className="w-full px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary transition-all" placeholder="0,00" value={prodPrice} onChange={e => setProdPrice(e.target.value)} />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">Preço Promo (opcional)</label>
                  <input type="number" className="w-full px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary transition-all" placeholder="Deixe vazio" value={prodPromo} onChange={e => setProdPromo(e.target.value)} />
                </div>

                <div className="flex items-center">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider mr-auto">Visível na loja</label>
                  <button type="button" onClick={() => setActive(a => !a)} className="flex items-center gap-2">
                    <div className={`w-10 h-[22px] rounded-full relative transition-colors ${active ? 'bg-accent' : 'bg-border'}`}>
                      <div className={`absolute top-[3px] w-4 h-4 bg-white rounded-full transition-all ${active ? 'left-[22px]' : 'left-[3px]'}`} />
                    </div>
                    <span className={`text-xs font-medium ${active ? 'text-accent' : 'text-muted'}`}>{active ? 'Ativo' : 'Inativo'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Variants */}
          <div className="bg-surface border border-border rounded-2xl p-5 mb-4">
            <div className="font-syne font-bold text-sm mb-4">Variações de Cor</div>

            {variants.map(v => (
              <div key={v.id} className="bg-surface2 border border-border rounded-2xl p-4 mb-3">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-5 h-5 rounded-full border-2 border-white/20 flex-shrink-0" style={{ background: v.colorHex }} />
                  <input className="flex-1 px-3 py-1.5 bg-surface border border-border rounded-lg text-foreground font-syne font-bold text-xs outline-none focus:border-primary transition-all" value={v.color} onChange={e => updateVariant(v.id, { color: e.target.value })} placeholder="Nome da cor" />
                  <input type="color" value={v.colorHex} onChange={e => updateVariant(v.id, { colorHex: e.target.value })} className="w-8 h-8 rounded-full cursor-pointer border-0 bg-transparent p-0" />
                  <button onClick={() => removeVariant(v.id)} className="px-2.5 py-1.5 bg-warm/10 border border-warm/30 rounded-lg text-warm text-xs">✕</button>
                </div>

                <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Estoque por tamanho</div>
                <div className="grid grid-cols-6 gap-2">
                  {SIZES.map(s => (
                    <div key={s} className="flex flex-col items-center gap-1">
                      <span className="text-[10px] font-bold text-muted">{s}</span>
                      <input
                        type="number"
                        min={0}
                        value={v.stock[s] ?? 0}
                        onChange={e => updateStock(v.id, s, parseInt(e.target.value) || 0)}
                        className="w-full text-center py-1.5 bg-surface border border-border rounded-lg text-foreground text-sm font-semibold outline-none focus:border-primary transition-all"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button onClick={addVariant} className="w-full py-2.5 border-2 border-dashed border-border rounded-xl text-muted text-xs hover:border-primary hover:text-primary transition-all">
              + Adicionar variação manualmente
            </button>
          </div>

          {/* Save buttons */}
          <div className="flex gap-3">
            <button onClick={() => router.back()} className="flex-1 py-3 border border-border rounded-xl text-muted text-sm hover:border-muted hover:text-foreground transition-all">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving} className="flex-[2] py-3 bg-primary text-white font-syne font-bold text-sm rounded-xl hover:shadow-[0_4px_20px_var(--primary-glow)] hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-wait">
              {saving ? 'Publicando…' : '✓ Publicar produto'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
