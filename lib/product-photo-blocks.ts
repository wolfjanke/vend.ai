/**
 * Limites do cadastro por blocos (vários produtos numa análise).
 *
 * MAX_BLOCKS = 4: acima disso a IA tende a confundir nomes, categorias e variantes
 * entre produtos no mesmo JSON. Quatro produtos × até ~2–3 fotos cabe bem em 10 imagens.
 *
 * MAX_PHOTOS_TOTAL = 10: limite do Gemini / API de análise.
 * MAX_PHOTOS_PER_BLOCK = 5: variações de cor/volume por peça (caso comum em moda).
 */
export const MAX_PRODUCT_BLOCKS = 4
export const MAX_PHOTOS_TOTAL = 10
export const MAX_PHOTOS_PER_BLOCK = 5

export function fileFingerprint(file: File): string {
  return `${file.name}|${file.size}|${file.lastModified}`
}

export function countBlockPhotos(groups: Array<{ imageIndices: number[] }>): number {
  return groups.reduce((sum, g) => sum + g.imageIndices.length, 0)
}
