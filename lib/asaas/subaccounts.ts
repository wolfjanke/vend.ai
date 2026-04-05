import { asaasFetch } from './client'
import { encrypt, decrypt } from '@/lib/crypto/subaccount-key'
import { sql } from '@/lib/db'
import { logServerError } from '@/lib/logger'

export interface CreateSubaccountData {
  storeId:       string
  name:          string
  email:         string
  cpfCnpj:       string
  birthDate:      string
  companyType:    string
  phone:         string
  mobilePhone:   string
  address:       string
  addressNumber: string
  province:      string
  postalCode:    string
}

interface AsaasAccountResponse {
  id:        string
  walletId:  string
  apiKey:    string
  status?:   string
  [key: string]: unknown
}

export async function createSubaccount(data: CreateSubaccountData): Promise<{
  accountId: string
  walletId:  string
  status:    string
}> {
  const { storeId, ...accountData } = data

  const response = await asaasFetch<AsaasAccountResponse>('/accounts', {
    method: 'POST',
    body: JSON.stringify(accountData),
  })

  const { id: accountId, walletId, apiKey, status = 'PENDING' } = response

  if (!accountId || !walletId || !apiKey) {
    throw new Error('Resposta inválida do Asaas: campos obrigatórios ausentes')
  }

  const apiKeyEnc = await encrypt(apiKey)

  await sql`
    UPDATE stores
    SET
      asaas_account_id       = ${accountId},
      asaas_wallet_id        = ${walletId},
      asaas_api_key_enc      = ${apiKeyEnc},
      asaas_onboarding_status = 'PENDING'
    WHERE id = ${storeId}
  `

  return { accountId, walletId, status }
}

interface AsaasDocumentItem {
  status:       string
  onboardingUrl?: string
  [key: string]: unknown
}

interface AsaasDocumentsResponse {
  data?: AsaasDocumentItem[]
  [key: string]: unknown
}

export async function getOnboardingUrl(storeId: string): Promise<string | null> {
  const rows = await sql`
    SELECT asaas_api_key_enc FROM stores WHERE id = ${storeId} LIMIT 1
  `

  const enc = rows[0]?.asaas_api_key_enc as string | null
  if (!enc) return null

  let subApiKey: string
  try {
    subApiKey = await decrypt(enc)
  } catch (err) {
    logServerError('[getOnboardingUrl] decrypt falhou', err)
    return null
  }

  try {
    const response = await asaasFetch<AsaasDocumentsResponse>(
      '/myAccount/documents',
      {},
      subApiKey,
    )

    const pending = (response.data ?? []).find(
      d => d.status === 'AWAITING_SEND' || d.onboardingUrl,
    )
    return pending?.onboardingUrl ?? null
  } catch (err) {
    logServerError('[getOnboardingUrl] chamada Asaas falhou', err)
    return null
  }
}
