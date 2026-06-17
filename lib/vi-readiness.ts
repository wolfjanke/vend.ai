import type { Product } from '@/types'

/** Mínimo de produtos ativos e completos para a Vi atender bem no Direct. */
export const VI_READINESS_MIN_PRODUCTS = 3

export type ViReadinessLevel = 'ready' | 'almost' | 'incomplete'

export type ProductReadinessIssue = 'no_photo' | 'no_price' | 'no_stock'

export type ProductReadinessDetail = {
  id:       string
  name:     string
  slug?:    string
  score:    number
  issues:   ProductReadinessIssue[]
  complete: boolean
}

export type ViReadinessStep = {
  id:    string
  label: string
  done:  boolean
  hint?: string
}

export type ViReadinessReport = {
  level:                ViReadinessLevel
  percent:              number
  activeProductCount:   number
  completeProductCount: number
  minProducts:          number
  incompleteProducts:   ProductReadinessDetail[]
  steps:                ViReadinessStep[]
}

export const PRODUCT_READINESS_ISSUE_LABELS: Record<ProductReadinessIssue, string> = {
  no_photo: 'sem foto',
  no_price: 'sem preço',
  no_stock: 'sem estoque',
}

export function productHasPhoto(product: Product): boolean {
  return (product.variants_json ?? []).some(v =>
    (v.photos ?? []).some(p => typeof p === 'string' && p.trim().length > 0),
  )
}

export function productHasValidPrice(product: Product): boolean {
  return Number(product.price) > 0
}

export function productHasStock(product: Product): boolean {
  return (product.variants_json ?? []).some(v =>
    Object.values(v.stock ?? {}).some(qty => Number(qty) > 0),
  )
}

/** Avalia um produto ativo: foto, preço e pelo menos 1 SKU com estoque > 0. */
export function assessProductReadiness(product: Product): Omit<ProductReadinessDetail, 'id' | 'name' | 'slug'> {
  const issues: ProductReadinessIssue[] = []
  if (!productHasPhoto(product)) issues.push('no_photo')
  if (!productHasValidPrice(product)) issues.push('no_price')
  if (!productHasStock(product)) issues.push('no_stock')

  let score = 0
  if (!issues.includes('no_photo')) score += 35
  if (!issues.includes('no_price')) score += 25
  if (!issues.includes('no_stock')) score += 40

  const complete = issues.length === 0 && product.name.trim().length > 0
  return { score, issues, complete }
}

function resolveLevel(completeCount: number, activeCount: number): ViReadinessLevel {
  if (completeCount >= VI_READINESS_MIN_PRODUCTS) return 'ready'
  if (completeCount >= 1 || activeCount >= 1) return 'almost'
  return 'incomplete'
}

function buildSteps(
  activeCount: number,
  completeCount: number,
  incompleteProducts: ProductReadinessDetail[],
): ViReadinessStep[] {
  const withoutPhoto = incompleteProducts.filter(p => p.issues.includes('no_photo')).length
  const withoutStock = incompleteProducts.filter(p => p.issues.includes('no_stock')).length

  return [
    {
      id:    'min_products',
      label: `Ter pelo menos ${VI_READINESS_MIN_PRODUCTS} produtos ativos prontos (foto, preço e estoque)`,
      done:  completeCount >= VI_READINESS_MIN_PRODUCTS,
      hint:  completeCount >= VI_READINESS_MIN_PRODUCTS
        ? undefined
        : `${completeCount} de ${VI_READINESS_MIN_PRODUCTS} prontos · ${activeCount} ativo(s) no total`,
    },
    {
      id:    'photos',
      label: 'Foto em cada produto ativo',
      done:  withoutPhoto === 0 && activeCount > 0,
      hint:  withoutPhoto > 0 ? `${withoutPhoto} produto(s) sem foto` : activeCount === 0 ? 'Cadastre o primeiro produto' : undefined,
    },
    {
      id:    'stock',
      label: 'Estoque em pelo menos 1 tamanho ou variação',
      done:  withoutStock === 0 && activeCount > 0,
      hint:  withoutStock > 0 ? `${withoutStock} produto(s) sem estoque` : undefined,
    },
  ]
}

/** Relatório agregado da loja para o painel "Sua Vi está pronta?". */
export function assessStoreViReadiness(products: Product[]): ViReadinessReport {
  const active = products.filter(p => p.active)

  const productDetails: ProductReadinessDetail[] = active.map(p => ({
    id:       p.id,
    name:     p.name,
    slug:     p.slug,
    ...assessProductReadiness(p),
  }))

  const completeCount = productDetails.filter(p => p.complete).length
  const avgScore = active.length === 0
    ? 0
    : Math.round(productDetails.reduce((s, p) => s + p.score, 0) / active.length)

  const countProgress = Math.min(100, Math.round((completeCount / VI_READINESS_MIN_PRODUCTS) * 100))
  const percent = Math.round(countProgress * 0.5 + avgScore * 0.5)

  const incompleteProducts = productDetails
    .filter(p => !p.complete)
    .sort((a, b) => a.score - b.score || a.name.localeCompare(b.name, 'pt-BR'))

  const level = resolveLevel(completeCount, active.length)

  return {
    level,
    percent,
    activeProductCount:   active.length,
    completeProductCount: completeCount,
    minProducts:          VI_READINESS_MIN_PRODUCTS,
    incompleteProducts,
    steps:                buildSteps(active.length, completeCount, incompleteProducts),
  }
}

export function viReadinessLevelLabel(level: ViReadinessLevel): string {
  switch (level) {
    case 'ready':      return 'Pronta'
    case 'almost':     return 'Quase lá'
    case 'incomplete': return 'Incompleta'
  }
}
