import { isBeautyCategory } from '@/lib/product-catalog'
import type { CatalogAxes, Product, PrimaryAxis, StockAxis } from '@/types'
import { CLOTHING_SIZES, isNumericStockKey, isVolumeStockKey } from '@/types'

const DEFAULT_AXES: CatalogAxes = { primaryAxis: 'color', stockAxis: 'clothing' }

export function inferCatalogAxes(product: Product): CatalogAxes {
  if (product.catalog_axes?.primaryAxis && product.catalog_axes?.stockAxis) {
    return product.catalog_axes
  }

  const variants = product.variants_json ?? []
  const allKeys = variants.flatMap(v => Object.keys(v.stock ?? {}))
  const hasVolumeKeys = allKeys.some(isVolumeStockKey)
  const hasClothingKeys = allKeys.some(k => CLOTHING_SIZES.includes(k) && k !== 'Único')
  const hasNumericKeys = allKeys.some(isNumericStockKey)
  const onlyUnique = allKeys.length > 0 && allKeys.every(k => k === 'Único')

  if (hasNumericKeys && !hasVolumeKeys && !hasClothingKeys) {
    return {
      primaryAxis: variants.length > 1 ? 'color' : DEFAULT_AXES.primaryAxis,
      stockAxis:   'numeric',
    }
  }

  if (hasVolumeKeys || (isBeautyCategory(product.category) && variants.length === 1 && !hasClothingKeys)) {
    if (hasVolumeKeys || variants.some(v => Object.keys(v.stockPrices ?? {}).length > 0)) {
      return { primaryAxis: 'none', stockAxis: 'volume' }
    }
  }

  if (onlyUnique && variants.length <= 1) {
    const vt = variants[0]?.variantType
    if (vt === 'modelo' || isBeautyCategory(product.category)) {
      return { primaryAxis: 'model', stockAxis: 'unique' }
    }
    return { primaryAxis: 'none', stockAxis: 'unique' }
  }

  if (variants.length > 1) {
    return { primaryAxis: 'color', stockAxis: 'clothing' }
  }

  return DEFAULT_AXES
}

export function getCatalogAxes(product: Product): CatalogAxes {
  return inferCatalogAxes(product)
}

export function getAxisLabels(axes: CatalogAxes): {
  primary: string
  secondary: string
  stockGrid: string
} {
  const secondary =
    axes.stockAxis === 'volume' ? 'Volume'
    : axes.stockAxis === 'unique' ? 'Unidade'
    : axes.stockAxis === 'numeric' ? 'Tamanho'
    : 'Tamanho'

  const primary =
    axes.primaryAxis === 'color' ? 'Cor'
    : axes.primaryAxis === 'model' ? 'Variação'
    : 'Variação'

  const stockGrid =
    axes.stockAxis === 'volume' ? 'Estoque por volume'
    : axes.stockAxis === 'unique' ? 'Estoque'
    : 'Estoque por tamanho'

  return { primary, secondary, stockGrid }
}

export function shouldShowPrimarySelector(product: Product): boolean {
  const axes = getCatalogAxes(product)
  const variants = product.variants_json ?? []
  if (axes.primaryAxis === 'none') return false
  if (axes.primaryAxis === 'color' && variants.length > 1) return true
  if (axes.primaryAxis === 'model' && variants.length > 1) return true
  return false
}

export function shouldShowSecondarySelector(product: Product): boolean {
  const axes = getCatalogAxes(product)
  if (axes.stockAxis === 'unique') {
    const v = product.variants_json?.[0]
    const keys = Object.keys(v?.stock ?? {}).filter(k => Number(v?.stock?.[k]) > 0)
    return keys.length > 1
  }
  return true
}

export function secondarySelectMessage(axes: CatalogAxes): string {
  if (axes.stockAxis === 'volume') return 'Escolha um volume para continuar'
  if (axes.stockAxis === 'unique') return 'Escolha uma opção para continuar'
  return 'Escolha um tamanho para continuar'
}

export function primarySelectMessage(axes: CatalogAxes): string {
  if (axes.primaryAxis === 'color') return 'Escolha uma cor para continuar'
  return 'Escolha uma variação para continuar'
}

export function variationKindLabel(kind: string | undefined, volumeLabels?: string[]): string {
  switch (kind) {
    case 'volume':
      return volumeLabels?.length
        ? `Volumes: ${volumeLabels.join(', ')}`
        : 'Volumes diferentes detectados'
    case 'color':
      return 'Cores diferentes'
    case 'bottle':
      return 'Frasco único'
    case 'concentration':
      return 'Concentrações diferentes (EDT/EDP)'
    case 'single':
      return 'Produto único'
    default:
      return 'Variações detectadas'
  }
}
