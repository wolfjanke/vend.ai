'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter }        from 'next/navigation'
import { ImagePlus } from 'lucide-react'
import type {
  Product,
  ProductVariant,
  CustomCategory,
  VariantType,
  ProductAnalysisHints,
  ProductAudienceHint,
  ProductAnalysisMode,
  ProductAudience,
  ProductAudienceConfidence,
  CatalogAxes,
  PhotoVariationHint,
  StockAxis,
} from '@/types'
import { PRODUCT_CATEGORIES, CLOTHING_SIZES, getCategoryDisplayLabel, PRODUCT_AUDIENCE_OPTIONS, stockKeysForAxes } from '@/types'
import { adminCard } from '@/lib/admin-ui'
import { stripEmojis } from '@/lib/strip-emoji'
import MaskedInput from '@/components/ui/MaskedInput'
import { numberToCurrencyInput, parseCurrency } from '@/lib/masks'
import type { AnalysisAiMeta, MappedVariantDraft } from '@/lib/product-analysis-map'
import { stockAxisFromProduct } from '@/lib/product-analysis-map'
import { getAxisLabels, variationKindLabel } from '@/lib/catalog-axes'

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
  stockPrices?:      Record<string, number>
  stockPromoPrices?: Record<string, number>
  variantType:       VariantType
}

type BatchProductDraft = {
  nome:                 string
  descricao:            string
  categoria:            string
  audience:             ProductAudience | null
  audienceConfidence:   ProductAudienceConfidence | null
  variantes:            Array<{ cor: string; corHex: string }>
  catalogAxes?:         CatalogAxes
  aiMeta?:              AnalysisAiMeta | null
  variantDrafts?:       MappedVariantDraft[]
  file:                 File
  photoFiles?:          File[]
}

const VARIANT_TYPE_OPTIONS: Array<{ value: VariantType; label: string }> = [
  { value: 'cor',      label: 'Cor' },
  { value: 'modelo',   label: 'Modelo / Referência' },
  { value: 'estampa',  label: 'Estampa' },
  { value: 'material', label: 'Material' },
  { value: 'tamanho',  label: 'Tamanho (variação gratuita)' },
]

type CadastroStep = 1 | 2 | 3 | 4

const PHOTO_VARIATION_OPTIONS: Array<{ value: PhotoVariationHint | 'unspecified'; label: string }> = [
  { value: 'unspecified',    label: 'Não informar (IA decide)' },
  { value: 'colors',         label: 'Cores diferentes' },
  { value: 'volumes',        label: 'Volumes diferentes (50ml, 100ml…)' },
  { value: 'concentrations', label: 'Concentrações (EDT, EDP…)' },
]

const STOCK_AXIS_OPTIONS: Array<{ value: StockAxis; label: string }> = [
  { value: 'clothing', label: 'Tamanho de roupa (P, M, G…)' },
  { value: 'volume',   label: 'Volume (ml)' },
  { value: 'unique',   label: 'Único (sem variação de tamanho)' },
]

const AUDIENCE_HINT_OPTIONS: Array<{ value: ProductAudienceHint; label: string }> = [
  { value: '',          label: 'Não informar' },
  { value: 'feminine',  label: 'Feminino' },
  { value: 'masculine', label: 'Masculino' },
  { value: 'kids',      label: 'Infantil' },
  { value: 'unisex',    label: 'Unissex' },
  { value: 'mixed',     label: 'Misto' },
]

function BatchDraftThumb({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])
  if (!url) {
    return <div className="w-14 h-14 rounded-xl bg-surface2 border border-border shrink-0" />
  }
  return (
    <img
      src={url}
      alt=""
      className="w-14 h-14 rounded-xl object-cover border border-border shrink-0"
    />
  )
}

function hintModeCardClass(selected: boolean): string {
  const base = `${adminCard} p-5 min-h-[5.5rem] w-full text-left transition-colors`
  return selected
    ? `${base} border-primary bg-primary/10 text-primary`
    : `${base} bg-surface2 hover:border-primary/40`
}

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
            className={`flex-1 min-w-0 flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl border text-center transition-colors ${
              active
                ? 'border-primary bg-primary/10 text-primary'
                : done
                  ? 'border-accent/40 bg-accent/5 text-accent'
                  : 'border-border bg-surface2 text-muted'
            }`}
          >
            <span className="font-syne font-bold text-sm tabular-nums">{n}</span>
            <span className="text-xs font-medium truncate w-full">{label}</span>
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
  const [hintPhotoVariation, setHintPhotoVariation] = useState<PhotoVariationHint | 'unspecified'>('unspecified')
  const [catalogAxes, setCatalogAxes] = useState<CatalogAxes>({ primaryAxis: 'color', stockAxis: 'clothing' })
  const [aiMeta, setAiMeta] = useState<AnalysisAiMeta | null>(null)
  const [customStockKey, setCustomStockKey] = useState('')
  const [batchQueue, setBatchQueue]     = useState<BatchProductDraft[]>([])
  const [batchIndex, setBatchIndex]     = useState(0)
  const [active,    setActive]    = useState(true)
  const [postAiPhotoNote, setPostAiPhotoNote] = useState('')

  const [prodName,  setProdName]  = useState('')
  const [prodDesc,  setProdDesc]  = useState('')
  const [prodCat,   setProdCat]   = useState('')
  const [prodAudience, setProdAudience] = useState<ProductAudience | ''>('')
  const [prodPrice, setProdPrice] = useState('')
  const [prodPromo, setProdPromo] = useState('')
  const [variants,  setVariants]  = useState<VariantState[]>([])

  const [aiBadges, setAiBadges] = useState({ name: false, desc: false, cat: false, audience: false })
  const [aiAudienceConfidence, setAiAudienceConfidence] = useState<ProductAudienceConfidence | null>(null)

  useEffect(() => {
    if (!initialProduct) return
    setProdName(initialProduct.name)
    setProdDesc(initialProduct.description ?? '')
    setProdCat(initialProduct.category ?? 'outro')
    setProdAudience(initialProduct.audience ?? '')
    setProdPrice(numberToCurrencyInput(Number(initialProduct.price ?? 0)))
    setProdPromo(initialProduct.promo_price != null ? numberToCurrencyInput(Number(initialProduct.promo_price)) : '')
    setActive(initialProduct.active ?? true)
    if (initialProduct.catalog_axes) {
      setCatalogAxes(initialProduct.catalog_axes)
    } else {
      setCatalogAxes({
        primaryAxis: stockAxisFromProduct(null, initialProduct.variants_json) === 'volume' ? 'none' : 'color',
        stockAxis:   stockAxisFromProduct(null, initialProduct.variants_json),
      })
    }
    setVariants(
      (initialProduct.variants_json ?? []).map((v: ProductVariant) => {
        const axis = initialProduct.catalog_axes?.stockAxis ?? stockAxisFromProduct(null, [v])
        return {
          id:                v.id,
          color:             v.color,
          colorHex:          v.colorHex ?? '#888888',
          photos:            [],
          existingPhotoUrls: v.photos ?? [],
          stock:             v.stock ?? Object.fromEntries(stockKeysForAxes(axis, v.stock).map(s => [s, 0])),
          stockPrices:       v.stockPrices ?? {},
          stockPromoPrices:  v.stockPromoPrices ?? {},
          variantType:       v.variantType ?? 'cor',
        }
      })
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
    if (hintMode === 'single' && hintPhotoVariation !== 'unspecified') {
      hints.photoVariation = hintPhotoVariation
    }
    return hints
  }

  function variantDraftsToState(drafts: MappedVariantDraft[], filesSnapshot: File[]): VariantState[] {
    return drafts.map(d => ({
      id:               d.id,
      color:            d.color,
      colorHex:         d.colorHex,
      photos:           d.photoIndices.flatMap(i => (filesSnapshot[i] ? [filesSnapshot[i]] : [])),
      stock:            d.stock,
      stockPrices:      d.stockPrices ?? {},
      stockPromoPrices: {},
      variantType:      d.variantType,
    }))
  }

  function applySingleAnalysis(
    data: {
      nome?: string
      descricao?: string
      categoria?: string
      audience?: ProductAudience | null
      audienceConfidence?: ProductAudienceConfidence | null
      variantes?: Array<{ cor: string; corHex: string }>
      catalogAxes?: CatalogAxes
      aiMeta?: AnalysisAiMeta
      variantDrafts?: MappedVariantDraft[]
    },
    filesSnapshot: File[],
  ) {
    setBatchQueue([])
    setBatchIndex(0)
    setProdName(stripEmojis(data.nome ?? ''))
    setProdDesc(stripEmojis(data.descricao ?? ''))
    setProdCat(data.categoria ?? '')
    setProdAudience(data.audience ?? '')
    setAiAudienceConfidence(data.audienceConfidence ?? null)
    setAiBadges({ name: true, desc: true, cat: true, audience: Boolean(data.audience) })

    if (data.catalogAxes) setCatalogAxes(data.catalogAxes)
    if (data.aiMeta) setAiMeta(data.aiMeta)

    let generatedVariants: VariantState[]

    if (data.variantDrafts?.length) {
      generatedVariants = variantDraftsToState(data.variantDrafts, filesSnapshot)
      const kind = data.aiMeta?.variationKind
      if (kind === 'volume') {
        setPostAiPhotoNote('Volumes detectados — defina estoque e preço por volume na etapa final.')
      } else if (kind === 'color' && generatedVariants.length > 1) {
        setPostAiPhotoNote('A 1.ª foto corresponde à 1.ª variação listada, quando aplicável.')
      } else {
        setPostAiPhotoNote('')
      }
    } else {
      const rawVariantes = data.variantes ?? []
      generatedVariants = rawVariantes.map((v: { cor: string; corHex: string }) => ({
        id:               crypto.randomUUID(),
        color:            v.cor,
        colorHex:         v.corHex ?? '#888888',
        photos:           [] as File[],
        stock:            Object.fromEntries(CLOTHING_SIZES.map(s => [s, 0])),
        stockPrices:      {},
        stockPromoPrices: {},
        variantType:      'cor' as VariantType,
      }))

      if (generatedVariants.length === 0) {
        generatedVariants = [{
          id:               crypto.randomUUID(),
          color:            'Único',
          colorHex:         '#888888',
          photos:           [...filesSnapshot],
          stock:            Object.fromEntries(CLOTHING_SIZES.map(s => [s, 0])),
          stockPrices:      {},
          stockPromoPrices: {},
          variantType:      'cor' as VariantType,
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
        setPostAiPhotoNote('Fotos extra foram agrupadas na última variação — ajuste abaixo se precisar.')
      } else if (m === n && n > 1) {
        setPostAiPhotoNote('A 1.ª foto corresponde à 1.ª variação listada abaixo.')
      } else if (m < n) {
        setPostAiPhotoNote('Há mais variações do que fotos: algumas ficaram sem foto até você adicionar.')
      } else {
        setPostAiPhotoNote('')
      }
    }

    setVariants(generatedVariants)
    const label = data.aiMeta
      ? variationKindLabel(data.aiMeta.variationKind, data.aiMeta.volumeLabels)
      : `${generatedVariants.length} variação${generatedVariants.length > 1 ? 'ões' : ''}`
    setAiStatus(`✓ ${label}`)
  }

  function persistCurrentBatchDraft(source: BatchProductDraft[] = batchQueue): BatchProductDraft[] {
    if (source.length === 0) return source
    return source.map((item, i) => {
      if (i !== batchIndex) return item
      const mainPhotos =
        variants.length > 0 && variants[0].photos.length > 0
          ? variants[0].photos
          : item.photoFiles ?? [item.file]
      return {
        ...item,
        nome:      prodName,
        descricao: prodDesc,
        categoria: prodCat,
        audience:  prodAudience || null,
        catalogAxes,
        aiMeta,
        variantDrafts: variants.map(v => ({
          id:            v.id,
          color:         v.color,
          colorHex:      v.colorHex,
          stock:         v.stock,
          stockPrices:   v.stockPrices,
          variantType:   v.variantType,
          photoIndices:  [],
        })),
        variantes: variants.length
          ? variants.map(v => ({ cor: v.color, corHex: v.colorHex }))
          : item.variantes,
        photoFiles: mainPhotos,
      }
    })
  }

  function selectBatchProduct(index: number) {
    if (index === batchIndex || index < 0 || index >= batchQueue.length) return
    const updated = persistCurrentBatchDraft()
    setBatchQueue(updated)
    setBatchIndex(index)
    loadBatchProduct(updated, index)
  }

  function loadBatchProduct(queue: BatchProductDraft[], index: number) {
    const item = queue[index]
    if (!item) return
    setProdName(stripEmojis(item.nome))
    setProdDesc(stripEmojis(item.descricao))
    setProdCat(item.categoria)
    setProdAudience(item.audience ?? '')
    setAiAudienceConfidence(item.audienceConfidence ?? null)
    setProdPrice('')
    setProdPromo('')
    setAiBadges({ name: true, desc: true, cat: true, audience: Boolean(item.audience) })
    if (item.catalogAxes) setCatalogAxes(item.catalogAxes)
    if (item.aiMeta) setAiMeta(item.aiMeta)

    const photoFiles = item.photoFiles?.length ? item.photoFiles : [item.file]
    if (item.variantDrafts?.length) {
      setVariants(variantDraftsToState(item.variantDrafts, photoFiles))
    } else {
      const v = item.variantes[0] ?? { cor: 'Único', corHex: '#888888' }
      setVariants([{
        id:               crypto.randomUUID(),
        color:            v.cor,
        colorHex:         v.corHex ?? '#888888',
        photos:           [...photoFiles],
        stock:            Object.fromEntries(stockKeysForAxes(catalogAxes.stockAxis).map(s => [s, 0])),
        stockPrices:      {},
        stockPromoPrices: {},
        variantType:      'cor' as VariantType,
      }])
    }
    setPostAiPhotoNote(
      queue.length > 1
        ? 'Revise cada produto abaixo e publique um por vez na etapa final.'
        : '',
    )
    setAiStatus(`✓ ${queue.length} produto${queue.length > 1 ? 's' : ''} identificado${queue.length > 1 ? 's' : ''}`)
  }

  function applyBatchAnalysis(
    produtos: Array<{
      nome?: string
      descricao?: string
      categoria?: string
      audience?: ProductAudience | null
      audienceConfidence?: ProductAudienceConfidence | null
      variantes?: Array<{ cor: string; corHex: string }>
      catalogAxes?: CatalogAxes
      aiMeta?: AnalysisAiMeta
      variantDrafts?: MappedVariantDraft[]
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
          nome:               p.nome ?? `Produto ${i + 1}`,
          descricao:          p.descricao ?? '',
          categoria:          p.categoria ?? 'outro',
          audience:           p.audience ?? null,
          audienceConfidence: p.audienceConfidence ?? null,
          catalogAxes:        p.catalogAxes,
          aiMeta:             p.aiMeta,
          variantDrafts:      p.variantDrafts,
          variantes:          p.variantes?.length ? p.variantes : [{ cor: 'Único', corHex: '#888888' }],
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
      [600,  'Identificando o produto…'],
      [1500, 'Detectando variações…'],
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
          stock:       Object.fromEntries(stockKeysForAxes(catalogAxes.stockAxis).map(s => [s, 0])),
          stockPrices: {},
          stockPromoPrices: {},
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

  function addVariant() {
    setVariants(prev => [...prev, {
      id:               crypto.randomUUID(),
      color:            catalogAxes.primaryAxis === 'color' ? 'Nova cor' : 'Nova variação',
      colorHex:         '#888888',
      photos:           [],
      stock:            Object.fromEntries(stockKeysForAxes(catalogAxes.stockAxis).map(s => [s, 0])),
      stockPrices:      {},
      stockPromoPrices: {},
      variantType:      catalogAxes.stockAxis === 'volume' ? 'modelo' : 'cor',
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

  function updateStockPrice(variantId: string, size: string, priceStr: string) {
    const num = parseCurrency(priceStr)
    setVariants(prev => prev.map(v => {
      if (v.id !== variantId) return v
      const next = { ...(v.stockPrices ?? {}) }
      if (num > 0) next[size] = num
      else delete next[size]
      return { ...v, stockPrices: next }
    }))
  }

  function updateStockPromoPrice(variantId: string, size: string, priceStr: string) {
    const num = parseCurrency(priceStr)
    setVariants(prev => prev.map(v => {
      if (v.id !== variantId) return v
      const next = { ...(v.stockPromoPrices ?? {}) }
      if (num > 0) next[size] = num
      else delete next[size]
      return { ...v, stockPromoPrices: next }
    }))
  }

  function addCustomStockKey(variantId: string) {
    const key = customStockKey.trim()
    if (!key) return
    setVariants(prev => prev.map(v => {
      if (v.id !== variantId) return v
      return {
        ...v,
        stock: { ...v.stock, [key]: v.stock[key] ?? 0 },
      }
    }))
    setCustomStockKey('')
  }

  function handleStockAxisChange(axis: StockAxis) {
    setCatalogAxes(prev => ({
      primaryAxis: axis === 'volume' ? 'none' : prev.primaryAxis === 'none' ? 'color' : prev.primaryAxis,
      stockAxis:   axis,
    }))
    setVariants(prev => prev.map(v => ({
      ...v,
      stock: Object.fromEntries(
        stockKeysForAxes(axis, v.stock).map(s => [s, v.stock[s] ?? 0]),
      ),
    })))
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
          const stockPrices = v.stockPrices && Object.keys(v.stockPrices).length > 0 ? v.stockPrices : undefined
          const stockPromoPrices = v.stockPromoPrices && Object.keys(v.stockPromoPrices).length > 0
            ? v.stockPromoPrices
            : undefined
          return {
            id:          v.id,
            color:       v.color,
            colorHex:    v.colorHex,
            photos:      photoUrls,
            stock:       v.stock,
            variantType: v.variantType,
            stockPrices,
            stockPromoPrices,
          }
        })
      )

      const promoNum = prodPromo.trim() ? parseCurrency(prodPromo) : 0
      const payload = {
        name:          prodName.trim(),
        description:   prodDesc.trim(),
        category:      prodCat,
        audience:      prodAudience || null,
        price:         priceNum,
        promo_price:   promoNum > 0 ? promoNum : null,
        variants_json: finalVariants,
        catalog_axes:  catalogAxes,
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

  const axisLabels = getAxisLabels(catalogAxes)
  const showSkuPrices = catalogAxes.stockAxis === 'volume'
    || variants.some(v => Object.keys(v.stockPrices ?? {}).length > 0)

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

  const audienceSelect = (
    <select
      className="w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary transition-all appearance-none"
      value={prodAudience}
      onChange={e => {
        setProdAudience(e.target.value as ProductAudience | '')
        setAiBadges(p => ({ ...p, audience: false }))
        setAiAudienceConfidence(null)
      }}
    >
      <option value="">Selecionar…</option>
      {PRODUCT_AUDIENCE_OPTIONS.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )

  const audienceAiHint = aiBadges.audience && aiAudienceConfidence === 'baixa' ? (
    <span className="text-[11px] text-muted mt-1 block break-words">
      A peça era ambígua — sugerimos unissex. Ajuste se necessário.
    </span>
  ) : aiBadges.audience ? (
    <span className="text-[11px] text-primary mt-1 block">✦ Sugerido pela IA</span>
  ) : null

  const showCommercial = isEdit || step === 4
  const showReview = !isEdit && step === 3 && analyzed

  return (
    <div className="min-w-0">
      {!isEdit && <WizardStepIndicator step={step} />}

      {/* Etapa 1 — fotos + contexto */}
      {!isEdit && step === 1 && (
        <>
          <div
            className={`${adminCard} border-2 border-dashed mb-4 transition-all cursor-pointer ${
              files.length ? 'border-border' : 'border-border hover:border-primary hover:bg-primary/5'
            }`}
            onClick={() => !files.length && fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
            {files.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <ImagePlus size={28} strokeWidth={1.75} aria-hidden />
                </div>
                <div className="font-syne font-semibold text-base mb-1">Fotos do produto</div>
                <div className="text-sm text-muted mb-4 break-words max-w-md">
                  Roupas, perfumes ou outros — uma foto por cor ou volume ajuda a IA. Depois você revisa tudo.
                </div>
                <div className="px-5 py-2.5 min-h-[44px] flex items-center bg-primary/10 border border-primary rounded-xl text-primary text-sm font-semibold">
                  Abrir galeria
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

          <div className={`${adminCard} mb-4`}>
            <div className="font-syne font-bold text-base mb-1">Contexto para a IA</div>
            <p className="text-sm text-muted mb-5 break-words">
              A IA gera nome, descrição, categoria e público a partir das fotos — moda, perfumaria ou misto.
              Informe o tipo de produto quando souber (ex.: Perfumes, Vestido).
            </p>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-3">Como são essas fotos?</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setHintMode('single'); setHintQuantity(1) }}
                    className={hintModeCardClass(hintMode === 'single')}
                  >
                    <div className="font-syne font-semibold text-base mb-1">Um produto</div>
                    <div className={`text-sm break-words ${hintMode === 'single' ? 'text-primary/90' : 'text-muted'}`}>
                      Várias fotos = cores ou volumes do mesmo item
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHintMode('multi')
                      setHintQuantity(Math.max(2, files.length))
                    }}
                    className={hintModeCardClass(hintMode === 'multi')}
                  >
                    <div className="font-syne font-semibold text-base mb-1">Vários produtos</div>
                    <div className={`text-sm break-words ${hintMode === 'multi' ? 'text-primary/90' : 'text-muted'}`}>
                      1 foto ≈ 1 peça diferente
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="min-w-0">
                  <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Quantidade</label>
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
                  <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Tipo de produto</label>
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
                  <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Público</label>
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
                <div className="min-w-0">
                  <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">O que muda entre as fotos?</label>
                  <select
                    className="w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary appearance-none"
                    value={hintPhotoVariation}
                    onChange={e => setHintPhotoVariation(e.target.value as PhotoVariationHint | 'unspecified')}
                  >
                    {PHOTO_VARIATION_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {hintMode === 'single' && (
                <div>
                  <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Cores ou volumes</label>
                  <input
                    className="w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary"
                    placeholder="Ex.: preto, off-white — ou 50ml, 100ml"
                    value={hintColors}
                    onChange={e => setHintColors(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">
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
                ? 'Continuar com análise da IA'
                : 'Adicione ao menos uma foto'}
          </button>
        </>
      )}

      {/* Etapa 2 — analisando */}
      {!isEdit && step === 2 && (
        <div className={`${adminCard} mb-4 text-center`}>
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
          {postAiPhotoNote && batchQueue.length <= 1 && (
            <div className="mb-4 p-4 bg-surface2 border border-border rounded-2xl text-sm text-muted break-words">
              {postAiPhotoNote}
            </div>
          )}

          {batchQueue.length > 1 && (
            <div className={`${adminCard} mb-4`}>
              <div className="flex flex-wrap items-center gap-2 mb-1 font-syne font-bold text-base">
                {batchQueue.length} produtos identificados
                {aiStatus && (
                  <span className="text-accent bg-accent/10 border border-accent/30 rounded-full px-2.5 py-0.5 text-xs font-medium">
                    {aiStatus.replace(/^✓\s*/, '')}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted mb-4 break-words">
                A IA separou cada foto em um produto. Toque em um card para revisar nome, descrição e categoria antes de publicar.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {batchQueue.map((item, i) => {
                  const isActive = i === batchIndex
                  const displayName = isActive ? (prodName.trim() || item.nome) : item.nome
                  const displayCat = isActive ? (prodCat || item.categoria) : item.categoria
                  const thumbFile = item.photoFiles?.[0] ?? item.file
                  return (
                    <button
                      key={`${item.file.name}-${i}`}
                      type="button"
                      onClick={() => selectBatchProduct(i)}
                      className={`${adminCard} p-4 min-h-[44px] w-full text-left transition-colors ${
                        isActive
                          ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                          : 'bg-surface2 hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <BatchDraftThumb file={thumbFile} />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-muted uppercase tracking-wide mb-1">
                            Produto {i + 1}
                          </div>
                          <div className="font-syne font-semibold text-sm line-clamp-2 break-words mb-0.5">
                            {displayName || `Produto ${i + 1}`}
                          </div>
                          <div className="text-xs text-muted truncate">
                            {getCategoryDisplayLabel(displayCat, customCategories)}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className={`${adminCard} mb-4`}>
            <div className="flex flex-wrap items-center gap-2 mb-4 font-syne font-bold text-base">
              {batchQueue.length > 1 ? `Revisando produto ${batchIndex + 1}` : 'Revise a sugestão da IA'}
              <span className="text-primary bg-primary/10 border border-primary/30 rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                Etapa 3 de 4
              </span>
            </div>
            {aiStatus && batchQueue.length <= 1 && (
              <p className={`text-xs mb-4 break-words ${aiStatus.startsWith('✓') ? 'text-accent' : 'text-warm'}`}>{aiStatus}</p>
            )}
            {aiMeta && (
              <div className="mb-4 p-3 rounded-xl border border-primary/30 bg-primary/5 min-w-0">
                <p className="text-[11px] font-bold text-primary uppercase tracking-wider mb-1">O que a IA detectou</p>
                <p className="text-sm break-words">{variationKindLabel(aiMeta.variationKind, aiMeta.volumeLabels)}</p>
                {aiMeta.attributes?.concentration && (
                  <p className="text-xs text-muted mt-1 break-words">Concentração: {aiMeta.attributes.concentration}</p>
                )}
                {aiMeta.attributes?.volumeMl != null && (
                  <p className="text-xs text-muted mt-1">Volume no rótulo: {aiMeta.attributes.volumeMl} ml</p>
                )}
                {aiMeta.confidenceNotes?.map((note, i) => (
                  <p key={i} className="text-xs text-warm mt-1 break-words">{note}</p>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-3 mb-4">
              <div className="min-w-0">
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">Tipo de estoque</label>
                <select
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary appearance-none"
                  value={catalogAxes.stockAxis}
                  onChange={e => handleStockAxisChange(e.target.value as StockAxis)}
                >
                  {STOCK_AXIS_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">Nome</label>
                <input
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary"
                  value={prodName}
                  onChange={e => { setProdName(stripEmojis(e.target.value)); setAiBadges(p => ({ ...p, name: false })) }}
                />
                {aiBadges.name && <span className="text-[11px] text-primary mt-1 block">✦ Sugerido pela IA</span>}
              </div>
              <div>
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">Descrição</label>
                <textarea
                  className="w-full px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary min-h-[80px] resize-y"
                  value={prodDesc}
                  onChange={e => { setProdDesc(stripEmojis(e.target.value)); setAiBadges(p => ({ ...p, desc: false })) }}
                />
                {aiBadges.desc && <span className="text-[11px] text-primary mt-1 block">✦ Sugerido pela IA</span>}
              </div>
              <div>
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">Categoria</label>
                {categorySelect}
                {aiBadges.cat && <span className="text-[11px] text-primary mt-1 block">✦ Sugerido pela IA</span>}
              </div>
              <div>
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">Público</label>
                {audienceSelect}
                {audienceAiHint}
              </div>
            </div>
          </div>

          <div className={`${adminCard} mb-4`}>
            <div className="font-syne font-bold text-base mb-1">
              {catalogAxes.stockAxis === 'volume' ? 'Volumes detectados' : catalogAxes.primaryAxis === 'color' ? 'Cores detectadas' : 'Variações detectadas'}
            </div>
            <p className="text-sm text-muted mb-4 break-words">
              Ajuste {axisLabels.primary.toLowerCase()} antes de definir preço e estoque.
            </p>
            {variants.map(v => (
              <div key={v.id} className="flex items-center gap-2.5 mb-3 flex-wrap min-w-0">
                {catalogAxes.primaryAxis !== 'none' && (
                  <div className="w-5 h-5 rounded-full border-2 border-white/20 shrink-0" style={{ background: v.colorHex }} />
                )}
                <input
                  className="flex-1 min-w-0 min-h-[44px] px-3 py-2 bg-surface2 border border-border rounded-lg text-foreground text-sm outline-none focus:border-primary"
                  value={v.color}
                  onChange={e => updateVariant(v.id, { color: e.target.value })}
                />
                {catalogAxes.primaryAxis === 'color' && (
                  <input
                    type="color"
                    value={v.colorHex}
                    onChange={e => updateVariant(v.id, { colorHex: e.target.value })}
                    className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-full cursor-pointer border-0 bg-transparent p-0 shrink-0"
                    aria-label={`Cor de ${v.color}`}
                  />
                )}
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
                if (!prodName.trim()) { alert('Informe o nome do produto'); return }
                if (!prodCat) { alert('Selecione a categoria'); return }
                if (!prodAudience) { alert('Selecione o público (feminino, masculino, unissex ou infantil)'); return }
                if (!variants.length) { alert('Adicione ao menos uma variação'); return }
                if (batchQueue.length > 1) {
                  setBatchQueue(persistCurrentBatchDraft())
                }
                setStep(4)
              }}
              className="flex-[2] min-h-[44px] py-3 bg-primary text-white font-syne font-bold text-sm rounded-xl hover:shadow-[0_4px_20px_var(--primary-glow)] transition-all"
            >
              {batchQueue.length > 1
                ? `Continuar produto ${batchIndex + 1} →`
                : 'Confirmar e continuar →'}
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

          <div className={`${adminCard} mb-4`}>
            <div className="flex items-center gap-2 mb-4 font-syne font-bold text-base flex-wrap">
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
                  onChange={e => { setProdName(stripEmojis(e.target.value)); setAiBadges(p => ({ ...p, name: false })) }}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">Descrição</label>
                <textarea
                  className="w-full px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary transition-all min-h-[80px] resize-y"
                  value={prodDesc}
                  onChange={e => { setProdDesc(stripEmojis(e.target.value)); setAiBadges(p => ({ ...p, desc: false })) }}
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
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">Público</label>
                  {audienceSelect}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          <div className={`${adminCard} mb-4`}>
            <div className="font-syne font-bold text-base mb-1">Variações</div>
            <p className="text-sm text-muted mb-4 break-words">Cor, modelo ou estampa diferente = produto diferente (conta no limite do plano). {axisLabels.secondary} = variação gratuita.</p>

            <div className="mb-4 min-w-0">
              <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">Tipo de estoque</label>
              <select
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary appearance-none"
                value={catalogAxes.stockAxis}
                onChange={e => handleStockAxisChange(e.target.value as StockAxis)}
              >
                {STOCK_AXIS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {variants.map(v => {
              const noPhoto = variantHasNoPhoto(v)
              const stockKeys = stockKeysForAxes(catalogAxes.stockAxis, v.stock)
              return (
              <div key={v.id} className="bg-surface2 border border-border rounded-2xl p-4 mb-3">
                <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                  {catalogAxes.primaryAxis !== 'none' && (
                    <div className="w-5 h-5 rounded-full border-2 border-white/20 flex-shrink-0" style={{ background: v.colorHex }} />
                  )}
                  <input
                    className="flex-1 min-w-0 px-3 py-1.5 bg-surface border border-border rounded-lg text-foreground font-syne font-bold text-xs outline-none focus:border-primary transition-all"
                    value={v.color}
                    onChange={e => updateVariant(v.id, { color: e.target.value })}
                    placeholder="Nome da variação"
                  />
                  {catalogAxes.primaryAxis === 'color' && (
                    <input
                      type="color"
                      value={v.colorHex}
                      onChange={e => updateVariant(v.id, { colorHex: e.target.value })}
                      className="w-8 h-8 rounded-full cursor-pointer border-0 bg-transparent p-0 shrink-0"
                    />
                  )}
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
                  <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
                    Fotos {catalogAxes.primaryAxis === 'color' ? 'desta cor' : 'desta variação'}
                  </div>
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

                <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">{axisLabels.stockGrid}</div>
                <div className="space-y-2 mb-3">
                  {stockKeys.map(s => (
                    <div key={s} className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-center min-w-0">
                      <span className="text-[10px] font-bold text-muted break-words">{s}</span>
                      <input
                        type="number"
                        min={0}
                        value={v.stock[s] ?? 0}
                        onChange={e => updateStock(v.id, s, parseInt(e.target.value) || 0)}
                        className="w-full min-h-[44px] text-center py-1.5 bg-surface border border-border rounded-lg text-foreground text-sm font-semibold outline-none focus:border-primary"
                        aria-label={`Estoque ${s}`}
                      />
                      {showSkuPrices && (
                        <>
                          <MaskedInput
                            mask="currency"
                            className="w-full min-h-[44px] px-2 py-1.5 bg-surface border border-border rounded-lg text-foreground text-xs outline-none focus:border-primary"
                            placeholder={prodPrice || 'R$ 0,00'}
                            value={v.stockPrices?.[s] != null ? numberToCurrencyInput(v.stockPrices[s]) : ''}
                            onChange={val => updateStockPrice(v.id, s, val)}
                            inputMode="decimal"
                          />
                          <MaskedInput
                            mask="currency"
                            className="w-full min-h-[44px] px-2 py-1.5 bg-surface border border-border rounded-lg text-foreground text-xs outline-none focus:border-primary"
                            placeholder="Promo"
                            value={v.stockPromoPrices?.[s] != null ? numberToCurrencyInput(v.stockPromoPrices[s]) : ''}
                            onChange={val => updateStockPromoPrice(v.id, s, val)}
                            inputMode="decimal"
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
                {showSkuPrices && (
                  <p className="text-[10px] text-muted mb-2 break-words">Preço base do produto preenche linhas vazias na vitrine.</p>
                )}
                <div className="flex gap-2 items-center min-w-0">
                  <input
                    className="flex-1 min-w-0 min-h-[44px] px-3 py-2 bg-surface border border-border rounded-lg text-foreground text-xs outline-none focus:border-primary"
                    placeholder={catalogAxes.stockAxis === 'volume' ? 'Ex: 15ml' : 'Ex: XG'}
                    value={customStockKey}
                    onChange={e => setCustomStockKey(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => addCustomStockKey(v.id)}
                    className="shrink-0 min-h-[44px] px-3 py-2 border border-border rounded-lg text-xs text-muted hover:border-primary hover:text-primary"
                  >
                    + {axisLabels.secondary}
                  </button>
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
