'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter }        from 'next/navigation'
import type { Product, ProductVariant, CustomCategory, VariantType } from '@/types'
import { PRODUCT_CATEGORIES, SIZES } from '@/types'
import MaskedInput from '@/components/ui/MaskedInput'
import { numberToCurrencyInput, parseCurrency } from '@/lib/masks'

interface Props {
  storeId:           string
  productId?:       string
  initialProduct?:  Product
  customCategories?: CustomCategory[]
}

interface VariantState {
  id:                string
  color:             string
  colorHex:          string
  photos:            File[]
  existingPhotoUrls?: string[]
  stock:             Record<string, number>
  variantType:       VariantType
}

const VARIANT_TYPE_OPTIONS: Array<{ value: VariantType; label: string }> = [
  { value: 'cor',      label: 'Cor' },
  { value: 'modelo',   label: 'Modelo / Referência' },
  { value: 'estampa',  label: 'Estampa' },
  { value: 'material', label: 'Material' },
  { value: 'tamanho',  label: 'Tamanho (variação gratuita)' },
]

/** Reparte ficheiros pelas variações: 1 foto por cor na ordem; extras na última cor. */
function distributeFilesAcrossVariants(files: File[], variantCount: number): File[][] {
  if (variantCount <= 0) return []
  if (files.length === 0) return Array.from({ length: variantCount }, () => [])

  if (files.length >= variantCount) {
    const result: File[][] = []
    for (let i = 0; i < variantCount - 1; i++) {
      result.push([files[i]])
    }
    result.push(files.slice(variantCount - 1))
    return result
  }

  return Array.from({ length: variantCount }, (_, i) => (i < files.length ? [files[i]] : []))
}

/** Evita useMemo+revoke: no Strict Mode o cleanup revoga o blob e o useMemo devolvia a mesma URL inválida (ERR_FILE_NOT_FOUND). */
function VariantPhotoThumb({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)
    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [file])
  return (
    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-border shrink-0 group/thumb">
      {url ? (
        <img src={url} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-surface2 animate-pulse" aria-hidden />
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute inset-0 flex items-center justify-center bg-bg/70 text-warm text-xs font-bold opacity-0 group-hover/thumb:opacity-100 transition-opacity"
        aria-label="Remover foto"
      >
        ✕
      </button>
    </div>
  )
}

export default function ProdutoForm({ storeId: _storeId, productId, initialProduct, customCategories = [] }: Props) {
  const router  = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const isEdit  = Boolean(productId && initialProduct)

  const [files,     setFiles]     = useState<File[]>([])
  const [previews,  setPreviews]  = useState<string[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [aiStatus,  setAiStatus]  = useState('')
  const [analyzed,  setAnalyzed]  = useState(!!initialProduct)
  const [saving,    setSaving]    = useState(false)
  const [active,    setActive]    = useState(true)
  const [postAiPhotoNote, setPostAiPhotoNote] = useState('')

  const [prodName,  setProdName]  = useState('')
  const [prodDesc,  setProdDesc]  = useState('')
  const [prodCat,   setProdCat]   = useState('')
  const [prodPrice, setProdPrice] = useState('')
  const [prodPromo, setProdPromo] = useState('')
  const [variants,  setVariants]  = useState<VariantState[]>([])

  const [aiBadges, setAiBadges] = useState({ name: false, desc: false, cat: false })

  useEffect(() => {
    if (!initialProduct) return
    setProdName(initialProduct.name)
    setProdDesc(initialProduct.description ?? '')
    setProdCat(initialProduct.category ?? 'outro')
    setProdPrice(numberToCurrencyInput(Number(initialProduct.price ?? 0)))
    setProdPromo(initialProduct.promo_price != null ? numberToCurrencyInput(Number(initialProduct.promo_price)) : '')
    setActive(initialProduct.active ?? true)
    setVariants(
      (initialProduct.variants_json ?? []).map((v: ProductVariant) => ({
        id:                v.id,
        color:             v.color,
        colorHex:          v.colorHex ?? '#888888',
        photos:            [],
        existingPhotoUrls: v.photos ?? [],
        stock:             v.stock ?? Object.fromEntries(SIZES.map(s => [s, 0])),
        variantType:       v.variantType ?? 'cor',
      }))
    )
  }, [initialProduct])

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return
    const newFiles = Array.from(e.target.files)
    setFiles(prev => [...prev, ...newFiles])
    setPostAiPhotoNote('')
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
    setPostAiPhotoNote('')

    const steps: Array<[number, string]> = [
      [600,  'Identificando a peça…'],
      [1500, 'Detectando variações de cor…'],
      [2500, 'Gerando nome e descrição…'],
    ]
    steps.forEach(([t, msg]) => setTimeout(() => setAiStatus(msg), t))

    const filesSnapshot = [...files]

    try {
      const res = await fetch('/api/produtos/analyze', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ images: previews.slice(0, 10) }),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = data?.error ?? 'Não foi possível analisar com IA agora.'
        throw new Error(msg)
      }

      setProdName(data.nome ?? '')
      setProdDesc(data.descricao ?? '')
      setProdCat(data.categoria ?? '')
      setAiBadges({ name: true, desc: true, cat: true })

      const rawVariantes = data.variantes ?? []
      let generatedVariants: VariantState[] = rawVariantes.map(
        (v: { cor: string; corHex: string }, i: number) => ({
          id:          crypto.randomUUID(),
          color:       v.cor,
          colorHex:    v.corHex ?? '#888888',
          photos:      [] as File[],
          stock:       Object.fromEntries(SIZES.map(s => [s, 0])),
          variantType: 'cor' as VariantType,
        })
      )

      if (generatedVariants.length === 0) {
        generatedVariants = [{
          id:          crypto.randomUUID(),
          color:       'Único',
          colorHex:    '#888888',
          photos:      [...filesSnapshot],
          stock:       Object.fromEntries(SIZES.map(s => [s, 0])),
          variantType: 'cor' as VariantType,
        }]
      } else {
        const buckets = distributeFilesAcrossVariants(filesSnapshot, generatedVariants.length)
        generatedVariants = generatedVariants.map((gv, i) => ({
          ...gv,
          photos: buckets[i] ?? [],
        }))
      }

      const n = generatedVariants.length
      const m = filesSnapshot.length
      if (n > 1 && m > n) {
        setPostAiPhotoNote('Fotos extra foram agrupadas na última cor — ajuste abaixo se precisar.')
      } else if (m === n && n > 1) {
        setPostAiPhotoNote('A 1.ª foto corresponde à 1.ª cor listada abaixo, e assim por diante.')
      } else if (m < n) {
        setPostAiPhotoNote('Há mais variações de cor do que fotos: algumas cores ficaram sem foto até você adicionar.')
      }

      setVariants(generatedVariants)
      setAnalyzed(true)
      setFiles([])
      setPreviews([])
      setAiStatus(`✓ ${generatedVariants.length} variação${generatedVariants.length > 1 ? 'ões' : ''} identificada${generatedVariants.length > 1 ? 's' : ''}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro na análise — preencha manualmente'
      setAiStatus(msg)
      setAnalyzed(true)
    } finally {
      setAnalyzing(false)
    }
  }

  function addVariant() {
    setVariants(prev => [...prev, {
      id:          crypto.randomUUID(),
      color:       'Nova Cor',
      colorHex:    '#888888',
      photos:      [],
      stock:       Object.fromEntries(SIZES.map(s => [s, 0])),
      variantType: 'cor' as VariantType,
    }])
  }

  function removeVariant(id: string) {
    setVariants(prev => prev.filter(v => v.id !== id))
  }

  function updateVariant(id: string, patch: Partial<VariantState>) {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, ...patch } : v))
  }

  function updateStock(variantId: string, size: string, qty: number) {
    setVariants(prev => prev.map(v =>
      v.id === variantId ? { ...v, stock: { ...v.stock, [size]: qty } } : v
    ))
  }

  function addVariantPhotos(variantId: string, fileList: FileList | null) {
    if (!fileList?.length) return
    const next = Array.from(fileList)
    setVariants(prev => prev.map(v =>
      v.id === variantId ? { ...v, photos: [...v.photos, ...next] } : v
    ))
  }

  function removeNewPhoto(variantId: string, index: number) {
    setVariants(prev => prev.map(v =>
      v.id === variantId ? { ...v, photos: v.photos.filter((_, i) => i !== index) } : v
    ))
  }

  function removeExistingPhoto(variantId: string, index: number) {
    setVariants(prev => prev.map(v =>
      v.id === variantId
        ? { ...v, existingPhotoUrls: (v.existingPhotoUrls ?? []).filter((_, i) => i !== index) }
        : v
    ))
  }

  async function uploadPhoto(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async ev => {
        try {
          const base64 = ev.target?.result as string
          const res = await fetch('/api/upload', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ base64 }),
          })
          const data = await res.json()
          if (data.url) resolve(data.url)
          else reject(new Error('Upload failed'))
        } catch (e) { reject(e) }
      }
      reader.readAsDataURL(file)
    })
  }

  function variantHasNoPhoto(v: VariantState): boolean {
    return (v.existingPhotoUrls?.length ?? 0) === 0 && v.photos.length === 0
  }

  async function handleSave() {
    if (!prodName.trim()) { alert('Informe o nome do produto'); return }
    const priceNum = parseCurrency(prodPrice)
    if (priceNum <= 0) { alert('Informe o preço válido'); return }
    if (!variants.length) { alert('Adicione ao menos uma variação'); return }

    const missingPhoto = variants.some(variantHasNoPhoto)
    if (missingPhoto) {
      const ok = window.confirm('Uma ou mais cores estão sem foto. Deseja continuar mesmo assim?')
      if (!ok) return
    }

    setSaving(true)

    try {
      const finalVariants: ProductVariant[] = await Promise.all(
        variants.map(async v => {
          const newUrls = await Promise.all(v.photos.map(uploadPhoto))
          const photoUrls = [...(v.existingPhotoUrls ?? []), ...newUrls]
          return {
            id:          v.id,
            color:       v.color,
            colorHex:    v.colorHex,
            photos:      photoUrls,
            stock:       v.stock,
            variantType: v.variantType,
          }
        })
      )

      const promoNum = prodPromo.trim() ? parseCurrency(prodPromo) : 0
      const payload = {
        name:          prodName.trim(),
        description:   prodDesc.trim(),
        category:      prodCat,
        price:         priceNum,
        promo_price:   promoNum > 0 ? promoNum : null,
        variants_json: finalVariants,
        active,
      }

      const url = productId ? `/api/produtos/${productId}` : '/api/produtos'
      const method = productId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Erro ao salvar produto')
      }
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
      {/* Upload Zone - oculto em edição */}
      {!isEdit && (
      <div
        className={`border-2 border-dashed rounded-2xl transition-all cursor-pointer mb-4 ${
          files.length ? 'border-border' : 'border-border hover:border-primary hover:bg-primary/5'
        }`}
        onClick={() => !files.length && fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
            <div className="text-5xl mb-3">🖼️</div>
            <div className="font-syne font-semibold text-sm mb-1">Selecionar fotos da galeria</div>
            <div className="text-xs text-muted mb-4">Selecione várias fotos — a IA sugere variações de cor</div>
            <div className="px-4 py-2 bg-primary/10 border border-primary rounded-xl text-primary text-xs font-semibold">
              📂 Abrir galeria
            </div>
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
      )}

      {/* Analyze bar ou nota pós-distribuição */}
      {!isEdit && files.length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-3 p-4 bg-surface border border-border rounded-2xl mb-4">
          <div>
            <div className="font-semibold text-sm">
              {files.length} foto{files.length > 1 ? 's' : ''} selecionada{files.length > 1 ? 's' : ''}
            </div>
            {aiStatus && (
              <div className={`text-xs mt-0.5 ${analyzed ? 'text-accent' : 'text-primary'}`}>{aiStatus}</div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="px-3.5 py-2 border border-border rounded-xl text-muted text-xs hover:text-foreground transition-all"
            >
              + Adicionar
            </button>
            <button
              type="button"
              onClick={analyzeWithAI}
              disabled={analyzing}
              className="flex items-center gap-1.5 px-4 py-2 bg-grad text-bg font-syne font-bold text-xs rounded-xl hover:shadow-[0_4px_20px_var(--primary-glow)] transition-all disabled:opacity-70 disabled:cursor-wait"
            >
              {analyzing ? '⏳ Analisando…' : '✦ Analisar com IA'}
            </button>
          </div>
        </div>
      )}

      {!isEdit && analyzed && files.length === 0 && postAiPhotoNote && (
        <div className="mb-4 p-4 bg-surface2 border border-border rounded-2xl text-sm text-muted break-words">
          {postAiPhotoNote}
        </div>
      )}

      {/* Result */}
      {(analyzed || isEdit) && (
        <>
          {/* Product info */}
          <div className="bg-surface border border-border rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-4 font-syne font-bold text-sm">
              Informações do Produto
              {!isEdit && (
                <span className="text-primary bg-primary/10 border border-primary/30 rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                  ✦ Preenchido pela IA
                </span>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">Nome</label>
                <input
                  className="w-full px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary transition-all"
                  value={prodName}
                  onChange={e => { setProdName(e.target.value); setAiBadges(p => ({ ...p, name: false })) }}
                />
                {aiBadges.name && <span className="text-[11px] text-primary mt-1 block">✦ Sugerido pela IA</span>}
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">Descrição</label>
                <textarea
                  className="w-full px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary transition-all min-h-[80px] resize-y"
                  value={prodDesc}
                  onChange={e => { setProdDesc(e.target.value); setAiBadges(p => ({ ...p, desc: false })) }}
                />
                {aiBadges.desc && <span className="text-[11px] text-primary mt-1 block">✦ Sugerido pela IA</span>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">Categoria</label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary transition-all appearance-none"
                    value={prodCat}
                    onChange={e => { setProdCat(e.target.value); setAiBadges(p => ({ ...p, cat: false })) }}
                  >
                    <option value="">Selecionar…</option>
                    <optgroup label="Categorias padrão">
                      {PRODUCT_CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </optgroup>
                    {customCategories.length > 0 && (
                      <optgroup label="Categorias da loja">
                        {customCategories.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  {aiBadges.cat && <span className="text-[11px] text-primary mt-1 block">✦ Sugerido pela IA</span>}
                </div>

                <div>
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">Preço (R$)</label>
                  <MaskedInput
                    mask="currency"
                    className="w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary transition-all"
                    placeholder="R$ 0,00"
                    value={prodPrice}
                    onChange={setProdPrice}
                    inputMode="decimal"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">
                    Preço promocional (opcional)
                  </label>
                  <MaskedInput
                    mask="currency"
                    className="w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary transition-all"
                    placeholder="Deixe vazio se não houver promoção"
                    value={prodPromo}
                    onChange={setProdPromo}
                    inputMode="decimal"
                  />
                  <p className="text-[11px] text-muted mt-1.5 leading-snug break-words">
                    Com valor aqui, o produto entra na seção <span className="text-foreground/90">Promoções</span> na loja e
                    exibe o selo de promoção no card.
                  </p>
                </div>

                <div className="flex items-center">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider mr-auto">Visível na loja</label>
                  <button type="button" onClick={() => setActive(a => !a)} className="flex items-center gap-2">
                    <div className={`w-10 h-[22px] rounded-full relative transition-colors ${active ? 'bg-accent' : 'bg-border'}`}>
                      <div className={`absolute top-[3px] w-4 h-4 bg-white rounded-full transition-all ${active ? 'left-[22px]' : 'left-[3px]'}`} />
                    </div>
                    <span className={`text-xs font-medium ${active ? 'text-accent' : 'text-muted'}`}>
                      {active ? 'Ativo' : 'Inativo'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Variants */}
          <div className="bg-surface border border-border rounded-2xl p-5 mb-4">
            <div className="font-syne font-bold text-sm mb-1">Variações</div>
            <p className="text-[11px] text-muted mb-4 break-words">Cor, modelo ou estampa diferente = produto diferente (conta no limite do plano). Tamanho = variação gratuita.</p>

            {variants.map(v => {
              const noPhoto = variantHasNoPhoto(v)
              return (
              <div key={v.id} className="bg-surface2 border border-border rounded-2xl p-4 mb-3">
                <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                  <div className="w-5 h-5 rounded-full border-2 border-white/20 flex-shrink-0" style={{ background: v.colorHex }} />
                  <input
                    className="flex-1 min-w-0 px-3 py-1.5 bg-surface border border-border rounded-lg text-foreground font-syne font-bold text-xs outline-none focus:border-primary transition-all"
                    value={v.color}
                    onChange={e => updateVariant(v.id, { color: e.target.value })}
                    placeholder="Nome da variação"
                  />
                  <input
                    type="color"
                    value={v.colorHex}
                    onChange={e => updateVariant(v.id, { colorHex: e.target.value })}
                    className="w-8 h-8 rounded-full cursor-pointer border-0 bg-transparent p-0 shrink-0"
                  />
                  {noPhoto && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-warm px-2 py-0.5 rounded border border-warm/30 bg-warm/10">Sem foto</span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeVariant(v.id)}
                    className="px-2.5 py-1.5 bg-warm/10 border border-warm/30 rounded-lg text-warm text-xs shrink-0"
                  >
                    ✕
                  </button>
                </div>
                <div className="mb-3">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">Tipo de variação</label>
                  <select
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground text-xs outline-none focus:border-primary transition-all appearance-none"
                    value={v.variantType}
                    onChange={e => updateVariant(v.id, { variantType: e.target.value as VariantType })}
                  >
                    {VARIANT_TYPE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Fotos desta cor</div>
                  <div className="flex flex-wrap gap-2 items-start">
                    {(v.existingPhotoUrls ?? []).map((url, i) => (
                      <div key={`ex-${v.id}-${i}`} className="relative w-16 h-16 rounded-xl overflow-hidden border border-border shrink-0 group/thumb">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeExistingPhoto(v.id, i)}
                          className="absolute inset-0 flex items-center justify-center bg-bg/70 text-warm text-xs font-bold opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                          aria-label="Remover foto"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {v.photos.map((file, i) => (
                      <VariantPhotoThumb
                        key={`new-${v.id}-${i}-${file.name}-${file.size}-${file.lastModified}`}
                        file={file}
                        onRemove={() => removeNewPhoto(v.id, i)}
                      />
                    ))}
                    <label className="w-16 h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer text-muted text-xl hover:border-primary hover:text-primary transition-colors shrink-0 min-h-[44px] min-w-[44px] sm:min-h-[64px] sm:min-w-[64px] sm:w-16 sm:h-16">
                      <span className="sr-only">Adicionar fotos</span>
                      <span aria-hidden>+</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={e => {
                          addVariantPhotos(v.id, e.target.files)
                          e.target.value = ''
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-[10px] text-muted mt-2 break-words">Use + para enviar mais imagens desta cor. Remova miniaturas para excluir antes de salvar.</p>
                </div>

                <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Estoque por tamanho</div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
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
            )})}

            <button
              type="button"
              onClick={addVariant}
              className="w-full py-2.5 border-2 border-dashed border-border rounded-xl text-muted text-xs hover:border-primary hover:text-primary transition-all"
            >
              + Adicionar variação manualmente
            </button>
          </div>

          {/* Save buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-3 border border-border rounded-xl text-muted text-sm hover:border-muted hover:text-foreground transition-all"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-[2] py-3 bg-primary text-white font-syne font-bold text-sm rounded-xl hover:shadow-[0_4px_20px_var(--primary-glow)] hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-wait"
            >
              {saving ? (isEdit ? 'Salvando…' : 'Publicando…') : (isEdit ? '✓ Salvar alterações' : '✓ Publicar produto')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
