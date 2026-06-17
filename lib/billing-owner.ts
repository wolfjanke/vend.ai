import { sql } from '@/lib/db'
import {
  decryptTaxId,
  encryptTaxId,
  maskTaxIdForDisplay,
  type BillingOwnerType,
} from '@/lib/crypto/pii'
import {
  billingOwnerSchema,
  isDeliveryAddressEmpty,
  type BillingOwnerInput,
} from '@/lib/validations'
import { digitsOnly, formatPhoneDisplay } from '@/lib/masks'
import { createCustomer, updateCustomer, type UpdateCustomerInput } from '@/lib/payments/wolf-hub'
import { assertPaymentsConfigured } from '@/lib/payments/config'

export interface BillingOwnerPublic {
  hasBillingDoc:      boolean
  type:               BillingOwnerType | null
  docMasked:          string | null
  legalName:          string | null
  addressFilled:      boolean
  ownerEmail:         string | null
  ownerPhone:         string | null
  defaultHolderName:  string
}

interface StoreBillingRow {
  id: string
  name: string
  whatsapp: string
  settings_json: { ownerName?: string } | null
  asaas_billing_customer_id: string | null
  billing_owner_type: BillingOwnerType | null
  billing_owner_doc_enc: string | null
  billing_legal_name: string | null
  billing_postal_code: string | null
  billing_address: string | null
  billing_address_number: string | null
  billing_complement: string | null
  billing_province: string | null
  billing_city: string | null
  billing_state: string | null
  owner_email: string | null
}

async function loadStoreBillingRow(storeId: string): Promise<StoreBillingRow | undefined> {
  const rows = await sql`
    SELECT
      s.id, s.name, s.whatsapp, s.settings_json,
      s.asaas_billing_customer_id,
      s.billing_owner_type,
      s.billing_owner_doc_enc,
      s.billing_legal_name,
      s.billing_postal_code,
      s.billing_address,
      s.billing_address_number,
      s.billing_complement,
      s.billing_province,
      s.billing_city,
      s.billing_state,
      u.email AS owner_email
    FROM stores s
    LEFT JOIN admin_users u ON u.store_id = s.id
    WHERE s.id = ${storeId}
    LIMIT 1
  `
  return rows[0] as StoreBillingRow | undefined
}

function addressFilled(row: StoreBillingRow): boolean {
  return Boolean(
    row.billing_postal_code?.trim()
    && row.billing_address?.trim()
    && row.billing_address_number?.trim()
    && row.billing_city?.trim()
    && row.billing_state?.trim(),
  )
}

function resolveDefaultHolderName(
  row: Pick<StoreBillingRow, 'name' | 'settings_json'>,
): string {
  return row.settings_json?.ownerName?.trim() || row.name.trim()
}

function buildAccountContext(row: StoreBillingRow | undefined): Pick<
  BillingOwnerPublic,
  'ownerEmail' | 'ownerPhone' | 'defaultHolderName' | 'addressFilled'
> {
  if (!row) {
    return {
      ownerEmail:        null,
      ownerPhone:        null,
      defaultHolderName: '',
      addressFilled:     false,
    }
  }

  const phoneDigits = digitsOnly(row.whatsapp)
  return {
    ownerEmail:        row.owner_email,
    ownerPhone:        phoneDigits.length >= 10 ? formatPhoneDisplay(phoneDigits) : null,
    defaultHolderName: resolveDefaultHolderName(row),
    addressFilled:     addressFilled(row),
  }
}

export async function getBillingOwnerPublic(storeId: string): Promise<BillingOwnerPublic> {
  const row = await loadStoreBillingRow(storeId)
  const account = buildAccountContext(row)

  if (!row?.billing_owner_doc_enc || !row.billing_owner_type) {
    return {
      hasBillingDoc: false,
      type:          null,
      docMasked:     null,
      legalName:     row?.billing_legal_name ?? null,
      ...account,
    }
  }

  const digits = await decryptTaxId(row.billing_owner_doc_enc)
  return {
    hasBillingDoc: true,
    type:          row.billing_owner_type,
    docMasked:     maskTaxIdForDisplay(row.billing_owner_type, digits),
    legalName:     row.billing_legal_name,
    ...account,
  }
}

function normalizeAddress(input: BillingOwnerInput) {
  if (!input.address || isDeliveryAddressEmpty(input.address)) {
    return {
      billing_postal_code:    null as string | null,
      billing_address:        null as string | null,
      billing_address_number: null as string | null,
      billing_complement:     null as string | null,
      billing_province:       null as string | null,
      billing_city:           null as string | null,
      billing_state:          null as string | null,
    }
  }

  const cep = digitsOnly(input.address.cep)
  return {
    billing_postal_code:    cep.length === 8 ? cep : null,
    billing_address:        input.address.logradouro.trim() || null,
    billing_address_number: input.address.numero.trim() || null,
    billing_complement:     input.address.complemento?.trim() || null,
    billing_province:       input.address.bairro.trim() || null,
    billing_city:           input.address.cidade.trim() || null,
    billing_state:          input.address.uf.trim().toUpperCase() || null,
  }
}

export function resolveBillingCustomerName(
  row: Pick<StoreBillingRow, 'billing_legal_name' | 'name' | 'settings_json'>,
): string {
  if (row.billing_legal_name?.trim()) {
    return row.billing_legal_name.trim()
  }
  return resolveDefaultHolderName(row)
}

export async function buildAsaasCustomerPayload(storeId: string): Promise<UpdateCustomerInput | null> {
  const row = await loadStoreBillingRow(storeId)
  if (!row?.billing_owner_doc_enc || !row.billing_owner_type) return null

  const cpfCnpj = await decryptTaxId(row.billing_owner_doc_enc)
  const email = row.owner_email
  if (!email) return null

  const payload: UpdateCustomerInput = {
    name: resolveBillingCustomerName(row),
    email,
    cpfCnpj,
    mobilePhone: digitsOnly(row.whatsapp) || undefined,
    externalReference: storeId,
  }

  if (row.billing_postal_code) payload.postalCode = row.billing_postal_code
  if (row.billing_address) payload.address = row.billing_address
  if (row.billing_address_number) payload.addressNumber = row.billing_address_number
  if (row.billing_complement) payload.complement = row.billing_complement
  if (row.billing_province) payload.province = row.billing_province
  if (row.billing_city) payload.city = row.billing_city
  if (row.billing_state) payload.state = row.billing_state

  return payload
}

export async function syncAsaasBillingCustomer(storeId: string): Promise<void> {
  const row = await loadStoreBillingRow(storeId)
  if (!row?.asaas_billing_customer_id) return

  const payload = await buildAsaasCustomerPayload(storeId)
  if (!payload) return

  assertPaymentsConfigured()
  await updateCustomer(row.asaas_billing_customer_id, payload)
}

export async function saveBillingOwner(storeId: string, raw: unknown): Promise<BillingOwnerPublic> {
  const parsed = billingOwnerSchema.safeParse(raw)
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
      ?? parsed.error.flatten().formErrors[0]
      ?? 'Dados inválidos'
    throw new Error(first)
  }

  const input = parsed.data
  const docEnc = await encryptTaxId(input.cpfCnpj)
  const legalName = input.legalName?.trim() || null
  const addr = normalizeAddress(input)

  await sql`
    UPDATE stores SET
      billing_owner_type = ${input.type},
      billing_owner_doc_enc = ${docEnc},
      billing_legal_name = ${legalName},
      billing_postal_code = ${addr.billing_postal_code},
      billing_address = ${addr.billing_address},
      billing_address_number = ${addr.billing_address_number},
      billing_complement = ${addr.billing_complement},
      billing_province = ${addr.billing_province},
      billing_city = ${addr.billing_city},
      billing_state = ${addr.billing_state}
    WHERE id = ${storeId}
  `

  await syncAsaasBillingCustomer(storeId)
  return getBillingOwnerPublic(storeId)
}

export const BILLING_DOC_REQUIRED_MSG =
  'Informe CPF ou CNPJ em Plano ou Configurações → Conta antes de assinar.'
