import type { Store, StoreSettings } from '@/types'

/** Campos expostos na vitrine pública (nunca enviar asaas_*, user_id, plan, chaves). */
export type PublicStore = {
  id:            string
  slug:          string
  name:          string
  logo_url:      string | null
  whatsapp:      string
  settings_json: StoreSettings
  created_at:    string
  cep?:          string | null
  logradouro?:   string | null
  numero?:       string | null
  complemento?:  string | null
  bairro?:       string | null
  cidade?:       string | null
  uf?:           string | null
}

export function toPublicStore(row: Record<string, unknown>): PublicStore {
  return {
    id:            String(row.id),
    slug:          String(row.slug),
    name:          String(row.name),
    logo_url:      (row.logo_url as string | null) ?? null,
    whatsapp:      String(row.whatsapp),
    settings_json: (row.settings_json as StoreSettings) ?? {},
    created_at:    String(row.created_at),
    cep:           (row.cep as string | null) ?? null,
    logradouro:    (row.logradouro as string | null) ?? null,
    numero:        (row.numero as string | null) ?? null,
    complemento:   (row.complemento as string | null) ?? null,
    bairro:        (row.bairro as string | null) ?? null,
    cidade:        (row.cidade as string | null) ?? null,
    uf:            (row.uf as string | null) ?? null,
  }
}

/** Para uso no cliente: Store sem campos sensíveis. */
export function publicStoreAsStore(publicStore: PublicStore): Store {
  return {
    ...publicStore,
    user_id: '',
  }
}
