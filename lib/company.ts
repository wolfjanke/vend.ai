/** Dados da empresa responsável pelo vend.ai (footer e documentos legais). */
export const PRODUCT = {
  name: process.env.PRODUCT_NAME ?? 'vend.ai',
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
