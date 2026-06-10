import { digitsOnly } from '@/lib/masks'

export type SubaccountKind = 'mei' | 'pj'

export interface SubaccountFormInput {
  accountKind:   SubaccountKind
  name:          string
  email:         string
  cpfCnpj:       string
  birthDate:     string
  companyType?:  'MEI' | 'LIMITED' | 'INDIVIDUAL' | 'ASSOCIATION'
  phone?:        string
  mobilePhone:   string
  address:       string
  addressNumber: string
  province:      string
  postalCode:    string
}

export interface AsaasSubaccountPayload {
  name:          string
  email:         string
  cpfCnpj:       string
  birthDate:     string
  companyType:   string
  phone:         string
  mobilePhone:   string
  address:       string
  addressNumber: string
  province:      string
  postalCode:    string
}

/** Normaliza dados do formulário para o formato esperado pela API Asaas. */
export function buildAsaasSubaccountPayload(input: SubaccountFormInput): AsaasSubaccountPayload {
  const mobile = digitsOnly(input.mobilePhone)
  const landline = digitsOnly(input.phone ?? '')
  const companyType = input.accountKind === 'mei'
    ? 'MEI'
    : (input.companyType ?? 'LIMITED')

  return {
    name:          input.name.trim(),
    email:         input.email.trim(),
    cpfCnpj:       digitsOnly(input.cpfCnpj),
    birthDate:     input.birthDate,
    companyType,
    phone:         landline.length >= 10 ? landline : mobile,
    mobilePhone:   mobile,
    address:       input.address.trim(),
    addressNumber: input.addressNumber.trim(),
    province:      input.province.trim(),
    postalCode:    digitsOnly(input.postalCode),
  }
}
