/** Dados da empresa responsável pelo vendai.club (footer e documentos legais). */
import { BRAND } from '@/lib/brand'

export const PRODUCT = {
  name:        BRAND.name,
  domain:      BRAND.domain,
  displayName: BRAND.displayName,
} as const

export const COMPANY = {
  name:
    process.env.COMPANY_NAME ??
    'Wolf Hub Desenvolvimento de Software Não Customizável Ltda',
  cnpj: process.env.COMPANY_CNPJ ?? '67.038.423/0001-71',
  city: process.env.COMPANY_CITY ?? 'Curitiba - PR',
} as const

export function companyCityShort() {
  return COMPANY.city.replace(' - ', ', ')
}
