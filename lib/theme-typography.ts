import type { ThemeName } from '@/lib/themes'

/** Escala tipográfica da vitrine — apenas font-size / line-height (rem). */
export type ThemeTypography = {
  fsNome: string
  lhNome: string
  fsPreco: string
  lhPreco: string
  fsPrecoOld: string
  fsParcela: string
  lhParcela: string
  fsVariantColor: string
  fsBadge: string
  fsSection: string
  fsSectionSm: string
  fsSectionMd: string
  lhSection: string
  fsFilter: string
  fsSearch: string
  fsModalTitle: string
  lhModalTitle: string
  fsModalBody: string
  lhModalBody: string
  fsModalBtn: string
}

/**
 * Tamanhos por tema (atual → proposto, em rem).
 * Hierarquia: section > nome ≈ preço > cor/parcela/filtros > preço riscado.
 */
export const THEME_TYPOGRAPHY: Record<ThemeName, ThemeTypography> = {
  default: {
    fsNome: '1rem',
    lhNome: '1.35',
    fsPreco: '1.0625rem',
    lhPreco: '1.3',
    fsPrecoOld: '0.8125rem',
    fsParcela: '0.8125rem',
    lhParcela: '1.35',
    fsVariantColor: '0.8125rem',
    fsBadge: '0.8125rem',
    fsSection: '1.125rem',
    fsSectionSm: '1.25rem',
    fsSectionMd: '1.375rem',
    lhSection: '1.25',
    fsFilter: '0.9375rem',
    fsSearch: '1rem',
    fsModalTitle: '1.375rem',
    lhModalTitle: '1.25',
    fsModalBody: '1rem',
    lhModalBody: '1.5',
    fsModalBtn: '1rem',
  },
  boutique: {
    fsNome: '1rem',
    lhNome: '1.4',
    fsPreco: '1.0625rem',
    lhPreco: '1.3',
    fsPrecoOld: '0.8125rem',
    fsParcela: '0.8125rem',
    lhParcela: '1.35',
    fsVariantColor: '0.8125rem',
    fsBadge: '0.8125rem',
    fsSection: '1.1875rem',
    fsSectionSm: '1.3125rem',
    fsSectionMd: '1.5rem',
    lhSection: '1.3',
    fsFilter: '0.9375rem',
    fsSearch: '1rem',
    fsModalTitle: '1.4375rem',
    lhModalTitle: '1.25',
    fsModalBody: '1rem',
    lhModalBody: '1.5',
    fsModalBtn: '1rem',
  },
  street: {
    fsNome: '1.0625rem',
    lhNome: '1.2',
    fsPreco: '1.1875rem',
    lhPreco: '1.2',
    fsPrecoOld: '0.875rem',
    fsParcela: '0.875rem',
    lhParcela: '1.3',
    fsVariantColor: '0.875rem',
    fsBadge: '0.875rem',
    fsSection: '1.25rem',
    fsSectionSm: '1.375rem',
    fsSectionMd: '1.5rem',
    lhSection: '1.15',
    fsFilter: '1rem',
    fsSearch: '1.0625rem',
    fsModalTitle: '1.5rem',
    lhModalTitle: '1.2',
    fsModalBody: '1rem',
    lhModalBody: '1.45',
    fsModalBtn: '1rem',
  },
  editorial: {
    fsNome: '1.0625rem',
    lhNome: '1.35',
    fsPreco: '1.0625rem',
    lhPreco: '1.3',
    fsPrecoOld: '0.8125rem',
    fsParcela: '0.8125rem',
    lhParcela: '1.35',
    fsVariantColor: '0.8125rem',
    fsBadge: '0.8125rem',
    fsSection: '1.1875rem',
    fsSectionSm: '1.3125rem',
    fsSectionMd: '1.4375rem',
    lhSection: '1.3',
    fsFilter: '0.9375rem',
    fsSearch: '1rem',
    fsModalTitle: '1.4375rem',
    lhModalTitle: '1.25',
    fsModalBody: '1rem',
    lhModalBody: '1.5',
    fsModalBtn: '1rem',
  },
  pop: {
    fsNome: '1rem',
    lhNome: '1.35',
    fsPreco: '1.0625rem',
    lhPreco: '1.3',
    fsPrecoOld: '0.8125rem',
    fsParcela: '0.8125rem',
    lhParcela: '1.35',
    fsVariantColor: '0.8125rem',
    fsBadge: '0.8125rem',
    fsSection: '1.125rem',
    fsSectionSm: '1.3125rem',
    fsSectionMd: '1.4375rem',
    lhSection: '1.25',
    fsFilter: '0.9375rem',
    fsSearch: '1rem',
    fsModalTitle: '1.375rem',
    lhModalTitle: '1.25',
    fsModalBody: '1rem',
    lhModalBody: '1.5',
    fsModalBtn: '1rem',
  },
  fitness: {
    fsNome: '1.0625rem',
    lhNome: '1.25',
    fsPreco: '1.125rem',
    lhPreco: '1.2',
    fsPrecoOld: '0.875rem',
    fsParcela: '0.875rem',
    lhParcela: '1.3',
    fsVariantColor: '0.875rem',
    fsBadge: '0.875rem',
    fsSection: '1.1875rem',
    fsSectionSm: '1.3125rem',
    fsSectionMd: '1.4375rem',
    lhSection: '1.2',
    fsFilter: '1rem',
    fsSearch: '1.0625rem',
    fsModalTitle: '1.4375rem',
    lhModalTitle: '1.2',
    fsModalBody: '1rem',
    lhModalBody: '1.45',
    fsModalBtn: '1rem',
  },
  lumiere: {
    fsNome: '1.0625rem',
    lhNome: '1.35',
    fsPreco: '1.125rem',
    lhPreco: '1.3',
    fsPrecoOld: '0.8125rem',
    fsParcela: '0.8125rem',
    lhParcela: '1.35',
    fsVariantColor: '0.8125rem',
    fsBadge: '0.8125rem',
    fsSection: '1.1875rem',
    fsSectionSm: '1.3125rem',
    fsSectionMd: '1.4375rem',
    lhSection: '1.3',
    fsFilter: '0.9375rem',
    fsSearch: '1rem',
    fsModalTitle: '1.4375rem',
    lhModalTitle: '1.25',
    fsModalBody: '1rem',
    lhModalBody: '1.5',
    fsModalBtn: '1rem',
  },
}

export function getThemeTypography(themeName: ThemeName): ThemeTypography {
  return THEME_TYPOGRAPHY[themeName] ?? THEME_TYPOGRAPHY.default
}

export function themeTypographyCssVars(t: ThemeTypography): string {
  return `
    --theme-fs-nome: ${t.fsNome};
    --theme-lh-nome: ${t.lhNome};
    --theme-fs-preco: ${t.fsPreco};
    --theme-lh-preco: ${t.lhPreco};
    --theme-fs-preco-old: ${t.fsPrecoOld};
    --theme-fs-parcela: ${t.fsParcela};
    --theme-lh-parcela: ${t.lhParcela};
    --theme-fs-variant-color: ${t.fsVariantColor};
    --theme-fs-badge: ${t.fsBadge};
    --theme-fs-section: ${t.fsSection};
    --theme-fs-section-sm: ${t.fsSectionSm};
    --theme-fs-section-md: ${t.fsSectionMd};
    --theme-lh-section: ${t.lhSection};
    --theme-fs-filter: ${t.fsFilter};
    --theme-fs-search: ${t.fsSearch};
    --theme-fs-modal-title: ${t.fsModalTitle};
    --theme-lh-modal-title: ${t.lhModalTitle};
    --theme-fs-modal-body: ${t.fsModalBody};
    --theme-lh-modal-body: ${t.lhModalBody};
    --theme-fs-modal-btn: ${t.fsModalBtn};
  `.trim()
}
