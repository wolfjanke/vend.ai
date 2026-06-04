'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter }        from 'next/navigation'
import type {
  Product,
  ProductVariant,
  CustomCategory,
  VariantType,
  ProductAnalysisHints,
  ProductAudienceHint,
  ProductAnalysisMode,
} from '@/types'
import { PRODUCT_CATEGORIES, SIZES, getCategoryDisplayLabel } from '@/types'
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

type BatchProductDraft = {
  nome:       string
  descricao:  string
  categoria:  string
  variantes:  Array<{ cor: string; corHex: string }>
  file:       File
}

const VARIANT_TYPE_OPTIONS: Array<{ value: VariantType; label: string }> = [
  { value: 'cor',      label: 'Cor' },
  { value: 'modelo',   label: 'Modelo / Referência' },
  { value: 'estampa',  label: 'Estampa' },
  { value: 'material', label: 'Material' },
  { value: 'tamanho',  label: 'Tamanho (variação gratuita)' },
]

type CadastroStep = 1 | 2 | 3 | 4

const AUDIENCE_HINT_OPTIONS: Array<{ value: ProductAudienceHint; label: string }> = [
  { value: '',          label: 'Não informar' },
  { value: 'feminine',  label: 'Feminino' },
  { value: 'masculine', label: 'Masculino' },
  { value: 'kids',      label: 'Infantil' },
  { value: 'unisex',    label: 'Unissex' },
  { value: 'mixed',     label: 'Misto' },
]

function WizardStepIndicator({ step }: { step: CadastroStep }) {
  const items: Array<{ n: CadastroStep; label: string }> = [
    { n: 1, label: 'Fotos' },
    { n: 2, label: 'IA' },
    { n: 3, label: 'Revisar' },
    { n: 4, label: 'Publicar' },
  ]
  return (
    <nav className="mb-5 flex gap-1 min-w-0" aria-label="Etapas do cadastro">
      {items.map(({ n, label }) => {
        const done = step > n
        const active = step === n
        return (
          <div
            key={n}
            className={`flex-1 min-w-0 flex flex-col items-center gap-1 px-1 py-2 rounded-xl border text-center transition-colors ${
              active
                ? 'border-primary bg-primary/10 text-primary'
                : done
                  ? 'border-accent/40 bg-accent/5 text-accent'
                  : 'border-border bg-surface2 text-muted'
            }`}
          >
            <span className="font-syne font-bold text-xs tabular-nums">{n}</span>
            <span className="text-[10px] sm:text-[11px] font-medium truncate w-full">{label}</span>
          </div>
        )
      })}
    </nav>
  )
}

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
  const [step, setStep] = useState<CadastroStep>(1)
  const [analyzing, setAnalyzing] = useState(false)
  const [aiStatus,  setAiStatus]  = useState('')
  const [analyzed,  setAnalyzed]  = useState(!!initialProduct)
  const [saving,    setSaving]    = useState(false)
  const [savedAnalysisImages, setSavedAnalysisImages] = useState<string[]>([])
  const [hintMode, setHintMode]           = useState<ProductAnalysisMode>('single')
  const [hintQuantity, setHintQuantity]   = useState(1)
  const [hintPiece, setHintPiece]       = useState('')
  const [hintAudience, setHintAudience] = useState<ProductAudienceHint>('')
  const [hintColors, setHintColors]     = useState('')
  const [hintNote, setHintNote]         = useState('')
  const [batchQueue, setBatchQueue]     = useState<BatchProductDraft[]>([])
  const [batchIndex, setBatchIndex]     = useState(0)
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

  useEffect(() => {
    if (hintMode === 'single') setHintQuantity(1)
  }, [hintMode])

  useEffect(() => {
    if (hintMode === 'multi' && files.length >= 2 && files.length > hintQuantity) {
      setHintQuantity(files.length)
    }
  }, [hintMode, files.length, hintQuantity])

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return
    const newFiles = Array.from(e.target.files)
    setFiles(prev => [...prev, ...newFiles])
    setPostAiPhotoNote('')
    newFiles.forEach(f => {
      const reader = new FileReader()
      reader.onload = ev => {
        const dataUrl = ev.target?.result
        if (typeof dataUrl === 'string') {
          setPreviews(prev => [...prev, dataUrl])
        }
      }
      reader.readAsDataURL(f)
    })
    e.target.value = ''
  }

  const previewsStillLoading = files.length > previews.length

  /** Restaura miniaturas ao voltar da etapa 3 (após análise, previews globais são limpos). */
  function returnToIntakeStep() {
    if (savedAnalysisImages.length > 0) {
      setPreviews([...savedAnalysisImages])
      const variantFiles = variants.flatMap(v => v.photos)
      if (variantFiles.length > 0) setFiles(variantFiles)
    }
    setStep(1)
  }

  function buildAnalysisHints(): ProductAnalysisHints {
    const hints: ProductAnalysisHints = {
      mode:         hintMode,
      productCount: hintMode === 'single' ? 1 : hintQuantity,
    }
    if (hintPiece.trim()) hints.pieceType = hintPiece.trim()
    if (hintAudience) hints.audience = hintAudience
    if (hintMode === 'single' && hintColors.trim()) hints.colorsNote = hintColors.trim()
    if (hintNote.trim()) hints.freeText = hintNote.trim()
    return hints
  }

  function applySingleAnalysis(
    data: { nome?: string; descricao?: string; categoria?: string; variantes?: Array<{ cor: string; corHex: string }> },
    filesSnapshot: File[],
  ) {
    setBatchQueue([])
    setBatchIndex(0)
    setProdName(data.nome ?? '')
    setProdDesc(data.descricao ?? '')
    setProdCat(data.categoria ?? '')
    setAiBadges({ name: true, desc: true, cat: true })

    const rawVariantes = data.variantes ?? []
    let generatedVariants: VariantState[] = rawVariantes.map(
      (v: { cor: string; corHex: string }) => ({
        id:          crypto.randomUUID(),
        color:       v.cor,
        colorHex:    v.corHex ?? '#888888',
        photos:      [] as File[],
        stock:       Object.fromEntries(SIZES.map(s => [s, 0])),
        variantType: 'cor' as VariantType,
      }),
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
    } else {
      setPostAiPhotoNote('')
    }

    setVariants(generatedVariants)
    setAiStatus(`✓ ${generatedVariants.length} variação${generatedVariants.length > 1 ? 'ões' : ''} identificada${generatedVariants.length > 1 ? 's' : ''}`)
  }

  function loadBatchProduct(queue: BatchProductDraft[], index: number) {
    const item = queue[index]
    if (!item) return
    setProdName(item.nome)
    setProdDesc(item.descricao)
    setProdCat(item.categoria)
    setProdPrice('')
    setProdPromo('')
    setAiBadges({ name: true, desc: true, cat: true })
    const v = item.variantes[0] ?? { cor: 'Único', corHex: '#888888' }
    setVariants([{
      id:          crypto.randomUUID(),
      color:       v.cor,
      colorHex:    v.corHex ?? '#888888',
      photos:      [item.file],
      stock:       Object.fromEntries(SIZES.map(s => [s, 0])),
      variantType: 'cor' as VariantType,
    }])
    setPostAiPhotoNote(
      queue.length > 1
        ? `Produto ${index + 1} de ${queue.length}. Revise, publique e em seguida cadastramos o próximo.`
        : '',
    )
    setAiStatus(`✓ ${queue.length} produto${queue.length > 1 ? 's' : ''} identificado${queue.length > 1 ? 's' : ''}`)
  }

  function applyBatchAnalysis(
    produtos: Array<{
      nome?: string
      descricao?: string
      categoria?: string
      variantes?: Array<{ cor: string; corHex: string }>
      fotoIndice?: number
    }>,
    filesSnapshot: File[],
  ) {
    const queue: BatchProductDraft[] = produtos
      .map((p, i) => {
        const idx = typeof p.fotoIndice === 'number' ? p.fotoIndice : i
        const file = filesSnapshot[idx] ?? filesSnapshot[i]
        if (!file) return null
        return {
          nome:       p.nome ?? `Produto ${i + 1}`,
          descricao:  p.descricao ?? '',
          categoria:  p.categoria ?? 'outro',
          variantes:  p.variantes?.length ? p.variantes : [{ cor: 'Único', corHex: '#888888' }],
          file,
        }
      })
      .filter(Boolean) as BatchProductDraft[]

    if (!queue.length) throw new Error('Não foi possível associar fotos aos produtos detectados.')
    setBatchQueue(queue)
    setBatchIndex(0)
    loadBatchProduct(queue, 0)
  }

  async function runAnalysis(imageList: string[], filesSnapshot: File[]) {
    setAnalyzing(true)
    setAiStatus('Carregando imagens…')
    setPostAiPhotoNote('')

    const steps: Array<[number, string]> = [
      [600,  'Identificando a peça…'],
      [1500, 'Detectando variações de cor…'],
      [2500, 'Gerando nome e descrição…'],
    ]
    const timers = steps.map(([t, msg]) => setTimeout(() => setAiStatus(msg), t))

    try {
      const res = await fetch('/api/produtos/analyze', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          images: imageList.slice(0, 10),
          hints:  buildAnalysisHints(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = data?.error ?? 'Não foi possível analisar com IA agora.'
        throw new Error(msg)
      }

      if (data.batch && Array.isArray(data.produtos)) {
        applyBatchAnalysis(data.produtos, filesSnapshot)
      } else {
        applySingleAnalysis(data, filesSnapshot)
      }

      setAnalyzed(true)
      setFiles([])
      setPreviews([])
      if (!isEdit) setStep(3)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro na análise — preencha manualmente'
      setAiStatus(msg)
      setAnalyzed(true)
      if (!variants.length) {
        setVariants([{
          id:          crypto.randomUUID(),
          color:       'Único',
          colorHex:    '#888888',
          photos:      [...filesSnapshot],
          stock:       Object.fromEntries(SIZES.map(s => [s, 0])),
          variantType: 'cor' as VariantType,
        }])
      }
      if (!isEdit) setStep(3)
    } finally {
      timers.forEach(clearTimeout)
      setAnalyzing(false)
    }
  }

  async function startAnalysisFromIntake() {
    if (previewsStillLoading) {
      alert('Aguarde o carregamento das fotos na tela.')
      return
    }
    if (!previews.length) return
    if (hintMode === 'multi') {
      if (hintQuantity < 2) {
        alert('Informe ao menos 2 produtos no modo "Vários produtos".')
        return
      }
      if (files.length !== hintQuantity) {
        alert(`Adicione exatamente ${hintQuantity} foto${hintQuantity > 1 ? 's' : ''} (1 por produto). Você selecionou ${files.length}.`)
        return
      }
    }
    const imgs = previews.slice(0, 10)
    const filesForRun = [...files].slice(0, imgs.length)
    setSavedAnalysisImages(imgs)
    if (!isEdit) setStep(2)
    await runAnalysis(imgs, filesForRun)
  }

  async function reanalyzeFromReview() {
    const imgs = savedAnalysisImages.length > 0 ? savedAnalysisImages : previews.slice(0, 10)
    if (!imgs.length) {
      alert('Adicione fotos na etapa 1 para analisar novamente.')
      setStep(1)
      return
    }
    const filesFromVariants = variants.flatMap(v => v.photos)
    setStep(2)
    await runAnalysis(imgs, filesFromVariants.length > 0 ? filesFromVariants : [...files])
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

      if (!isEdit && batchQueue.length > 0 && batchIndex < batchQueue.length - 1) {
        const next = batchIndex + 1
        setBatchIndex(next)
        loadBatchProduct(batchQueue, next)
        setStep(3)
        return
      }

      setBatchQueue([])
      router.push('/admin/produtos')
      router.refresh()
    } catch (e) {
      alert(`Erro ao salvar: ${e instanceof Error ? e.message : e}`)
    } finally {
      setSaving(false)
    }
  }

  const categorySelect = (
    <select
      className="w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary transition-all appearance-none"
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
  )

  const showCommercial = isEdit || step === 4
  const showReview = !isEdit && step === 3 && analyzed

  return (
    <div className="min-w-0">
      {!isEdit && <WizardStepIndicator step={step} />}

      {/* Etapa 1 — fotos + contexto */}
      {!isEdit && step === 1 && (
        <>
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
                <div className="font-syne font-semibold text-sm mb-1">Fotos do produto</div>
                <div className="text-xs text-muted mb-4 break-words max-w-sm">
                  Uma foto por cor ajuda a IA. Depois você revisa tudo antes de publicar.
                </div>
                <div className="px-4 py-2 min-h-[44px] flex items-center bg-primary/10 border border-primary rounded-xl text-primary text-xs font-semibold">
                  📂 Abrir galeria
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2.5 p-4 cursor-default" onClick={e => e.stopPropagation()}>
                {previews.map((src, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border shrink-0">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-20 h-20 min-h-[44px] rounded-xl border-2 border-dashed border-border text-muted text-xl hover:border-primary hover:text-primary transition-colors shrink-0"
                  aria-label="Adicionar fotos"
                >
                  +
                </button>
              </div>
            )}
          </div>

          <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 mb-4">
            <div className="font-syne font-bold text-sm mb-1">Contexto para a IA</div>
            <p className="text-[11px] text-muted mb-4 break-words">
              A IA gera nome, descrição e categoria a partir das fotos. Você só indica quantos produtos são e o tipo geral.
            </p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-2">Como são essas fotos?</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setHintMode('single'); setHintQuantity(1) }}
                    className={`min-h-[44px] p-3 rounded-xl border text-left transition-colors ${
                      hintMode === 'single'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-surface2 text-muted hover:border-primary/40'
                    }`}
                  >
                    <div className="font-semibold text-sm">Um produto</div>
                    <div className="text-[11px] mt-0.5 break-words opacity-90">Várias fotos = cores do mesmo item</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHintMode('multi')
                      setHintQuantity(Math.max(2, files.length))
                    }}
                    className={`min-h-[44px] p-3 rounded-xl border text-left transition-colors ${
                      hintMode === 'multi'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-surface2 text-muted hover:border-primary/40'
                    }`}
                  >
                    <div className="font-semibold text-sm">Vários produtos</div>
                    <div className="text-[11px] mt-0.5 break-words opacity-90">1 foto ≈ 1 peça diferente</div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="min-w-0">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">Quantidade</label>
                  {hintMode === 'single' ? (
                    <div className="min-h-[44px] flex items-center px-3.5 bg-surface2 border border-border rounded-xl text-sm text-muted">
                      1 produto
                    </div>
                  ) : (
                    <>
                      <select
                        className="w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary appearance-none"
                        value={hintQuantity}
                        onChange={e => setHintQuantity(Number(e.target.value))}
                      >
                        {Array.from({ length: 9 }, (_, i) => i + 2).map(n => (
                          <option key={n} value={n}>{n} produtos</option>
                        ))}
                      </select>
                      <p className="text-[11px] text-muted mt-1.5 break-words">
                        {files.length > 0 && files.length !== hintQuantity
                          ? `Selecione ${hintQuantity} foto${hintQuantity > 1 ? 's' : ''} — hoje ${files.length}.`
                          : `Envie ${hintQuantity} foto${hintQuantity > 1 ? 's' : ''} (1 por produto).`}
                      </p>
                    </>
                  )}
                </div>
                <div className="min-w-0">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">Tipo de peça</label>
                  <select
                    className="w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary appearance-none"
                    value={hintPiece}
                    onChange={e => setHintPiece(e.target.value)}
                  >
                    <option value="">Não informar</option>
                    {PRODUCT_CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                    {customCategories.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="min-w-0">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">Público</label>
                  <select
                    className="w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary appearance-none"
                    value={hintAudience}
                    onChange={e => setHintAudience(e.target.value as ProductAudienceHint)}
                  >
                    {AUDIENCE_HINT_OPTIONS.map(o => (
                      <option key={o.value || 'none'} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {hintMode === 'single' && (
                <div>
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">Cores que você vê</label>
                  <input
                    className="w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary"
                    placeholder="Ex.: preto, off-white, azul marinho"
                    value={hintColors}
                    onChange={e => setHintColors(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">
                  Observação <span className="normal-case font-normal text-muted">(opcional)</span>
                </label>
                <textarea
                  className="w-full px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary min-h-[56px] resize-y break-words"
                  placeholder="Só se algo importante não aparecer na foto"
                  value={hintNote}
                  onChange={e => setHintNote(e.target.value)}
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={startAnalysisFromIntake}
            disabled={!files.length || analyzing || previewsStillLoading}
            className="w-full min-h-[44px] py-3 bg-grad text-bg font-syne font-bold text-sm rounded-xl hover:shadow-[0_4px_20px_var(--primary-glow)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {previewsStillLoading
              ? 'Carregando fotos…'
              : files.length
                ? '✦ Continuar com análise da IA'
                : 'Adicione ao menos uma foto'}
          </button>
        </>
      )}

      {/* Etapa 2 — analisando */}
      {!isEdit && step === 2 && (
        <div className="bg-surface border border-border rounded-2xl p-8 mb-4 text-center">
          <div className="text-4xl mb-4 animate-pulse" aria-hidden>✦</div>
          <div className="font-syne font-bold text-base mb-2">Analisando com IA…</div>
          <p className="text-sm text-primary break-words">{aiStatus || 'Aguarde um momento'}</p>
          {!analyzing && (
            <button
              type="button"
              onClick={() => setStep(savedAnalysisImages.length ? 3 : 1)}
              className="mt-6 min-h-[44px] px-4 text-xs text-muted hover:text-foreground border border-border rounded-xl"
            >
              Voltar
            </button>
          )}
        </div>
      )}

      {/* Etapa 3 — revisar sugestões */}
      {showReview && (
        <>
          {postAiPhotoNote && (
            <div className="mb-4 p-4 bg-surface2 border border-border rounded-2xl text-sm text-muted break-words">
              {postAiPhotoNote}
            </div>
          )}
          <div className="bg-surface border border-border rounded-2xl p-5 mb-4">
            <div className="flex flex-wrap items-center gap-2 mb-4 font-syne font-bold text-sm">
              Revise a sugestão da IA
              <span className="text-primary bg-primary/10 border border-primary/30 rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                Etapa 3 de 4
              </span>
              {batchQueue.length > 1 && (
                <span className="text-accent bg-accent/10 border border-accent/30 rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                  Produto {batchIndex + 1}/{batchQueue.length}
                </span>
              )}
            </div>
            {aiStatus && (
              <p className={`text-xs mb-4 break-words ${aiStatus.startsWith('✓') ? 'text-accent' : 'text-warm'}`}>{aiStatus}</p>
            )}
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">Nome</label>
                <input
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary"
                  value={prodName}
                  onChange={e => { setProdName(e.target.value); setAiBadges(p => ({ ...p, name: false })) }}
                />
                {aiBadges.name && <span className="text-[11px] text-primary mt-1 block">✦ Sugerido pela IA</span>}
              </div>
              <div>
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">Descrição</label>
                <textarea
                  className="w-full px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary min-h-[80px] resize-y"
                  value={prodDesc}
                  onChange={e => { setProdDesc(e.target.value); setAiBadges(p => ({ ...p, desc: false })) }}
                />
                {aiBadges.desc && <span className="text-[11px] text-primary mt-1 block">✦ Sugerido pela IA</span>}
              </div>
              <div>
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">Categoria</label>
                {categorySelect}
                {aiBadges.cat && <span className="text-[11px] text-primary mt-1 block">✦ Sugerido pela IA</span>}
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-5 mb-4">
            <div className="font-syne font-bold text-sm mb-1">Variações detectadas</div>
            <p className="text-[11px] text-muted mb-4 break-words">Ajuste nomes de cor antes de definir preço e estoque.</p>
            {variants.map(v => (
              <div key={v.id} className="flex items-center gap-2.5 mb-3 flex-wrap min-w-0">
                <div className="w-5 h-5 rounded-full border-2 border-white/20 shrink-0" style={{ background: v.colorHex }} />
                <input
                  className="flex-1 min-w-0 min-h-[44px] px-3 py-2 bg-surface2 border border-border rounded-lg text-foreground text-sm outline-none focus:border-primary"
                  value={v.color}
                  onChange={e => updateVariant(v.id, { color: e.target.value })}
                />
                <input
                  type="color"
                  value={v.colorHex}
                  onChange={e => updateVariant(v.id, { colorHex: e.target.value })}
                  className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-full cursor-pointer border-0 bg-transparent p-0 shrink-0"
                  aria-label={`Cor de ${v.color}`}
                />
                <span className="text-[11px] text-muted shrink-0">
                  {v.photos.length} foto{v.photos.length !== 1 ? 's' : ''}
                </span>
                <button
                  type="button"
                  onClick={() => removeVariant(v.id)}
                  className="min-h-[44px] px-3 py-2 bg-warm/10 border border-warm/30 rounded-lg text-warm text-xs shrink-0"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addVariant}
              className="w-full min-h-[44px] py-2.5 border-2 border-dashed border-border rounded-xl text-muted text-xs hover:border-primary hover:text-primary transition-all"
            >
              + Adicionar variação
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={returnToIntakeStep}
              className="flex-1 min-h-[44px] py-3 border border-border rounded-xl text-muted text-sm hover:text-foreground transition-all"
            >
              ← Voltar às fotos
            </button>
            <button
              type="button"
              onClick={() => {
                if (!window.confirm('A IA vai gerar novas sugestões e pode substituir nome, descrição e variações. Continuar?')) return
                void reanalyzeFromReview()
              }}
              disabled={analyzing}
              className="flex-1 min-h-[44px] py-3 border border-primary/40 rounded-xl text-primary text-sm hover:bg-primary/10 transition-all disabled:opacity-60"
            >
              Analisar de novo
            </button>
            <button
              type="button"
              onClick={() => {
                if (!prodName.trim()) { alert('Informe o nome do produto'); return }
                if (!prodCat) { alert('Selecione a categoria'); return }
                if (!variants.length) { alert('Adicione ao menos uma variação'); return }
                setStep(4)
              }}
              className="flex-[2] min-h-[44px] py-3 bg-primary text-white font-syne font-bold text-sm rounded-xl hover:shadow-[0_4px_20px_var(--primary-glow)] transition-all"
            >
              Confirmar e continuar →
            </button>
          </div>
        </>
      )}

      {showCommercial && (
        <>
          {!isEdit && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted break-words">Etapa 4 — preço, estoque e publicação</p>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-xs text-primary hover:underline min-h-[44px] px-2"
              >
                Ajustar revisão
              </button>
            </div>
          )}

          {postAiPhotoNote && !showReview && (
            <div className="mb-4 p-4 bg-surface2 border border-border rounded-2xl text-sm text-muted break-words">
              {postAiPhotoNote}
            </div>
          )}

          <div className="bg-surface border border-border rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-4 font-syne font-bold text-sm flex-wrap">
              Informações do Produto
              {!isEdit && (
                <span className="text-accent bg-accent/10 border border-accent/30 rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                  Revisado
                </span>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">Nome</label>
                <input
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary transition-all"
                  value={prodName}
                  onChange={e => { setProdName(e.target.value); setAiBadges(p => ({ ...p, name: false })) }}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">Descrição</label>
                <textarea
                  className="w-full px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary transition-all min-h-[80px] resize-y"
                  value={prodDesc}
                  onChange={e => { setProdDesc(e.target.value); setAiBadges(p => ({ ...p, desc: false })) }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="min-w-0">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">Categoria</label>
                  {categorySelect}
                  {prodCat && (
                    <p className="text-[11px] text-muted mt-1 break-words">
                      {getCategoryDisplayLabel(prodCat, customCategories)}
                    </p>
                  )}
                </div>

                <div className="min-w-0">
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

                <div className="min-w-0 sm:col-span-2">
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
                    Com valor aqui, o produto entra na seção Promoções na loja.
                  </p>
                </div>

                <div className="flex items-center min-h-[44px] sm:col-span-2">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider mr-auto">Visível na loja</label>
                  <button type="button" onClick={() => setActive(a => !a)} className="flex items-center gap-2 min-h-[44px]">
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
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => (isEdit ? router.back() : setStep(3))}
              className="flex-1 min-h-[44px] py-3 border border-border rounded-xl text-muted text-sm hover:border-muted hover:text-foreground transition-all"
            >
              {isEdit ? 'Cancelar' : '← Voltar à revisão'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-[2] min-h-[44px] py-3 bg-primary text-white font-syne font-bold text-sm rounded-xl hover:shadow-[0_4px_20px_var(--primary-glow)] hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-wait"
            >
              {saving
                ? (isEdit ? 'Salvando…' : 'Publicando…')
                : (isEdit
                  ? '✓ Salvar alterações'
                  : batchQueue.length > 1
                    ? `✓ Publicar ${batchIndex + 1}/${batchQueue.length}`
                    : '✓ Publicar produto')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
