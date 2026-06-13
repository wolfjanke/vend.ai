import { sql } from '@/lib/db'

export const LGPD_ANON_NAME = 'Titular removido (LGPD)'
export const LGPD_ANON_PHONE = '***'

export const LGPD_RETENTION_MONTHS = 24

/** Anonimiza pedidos de um cliente (por WhatsApp normalizado) em uma loja. */
export async function anonymizeCustomerOrders(
  storeId: string,
  phoneDigits: string,
  auditNote: string,
): Promise<{ updated: number }> {
  const noteLine = `\n[LGPD] ${auditNote} ${new Date().toISOString()}`

  const result = await sql`
    UPDATE orders
    SET
      customer_name = ${LGPD_ANON_NAME},
      customer_whatsapp = ${LGPD_ANON_PHONE},
      customer_email = NULL,
      customer_cpf_enc = NULL,
      notes = COALESCE(notes, '') || ${noteLine},
      delivery_address = NULL
    WHERE store_id = ${storeId}
      AND customer_whatsapp != ${LGPD_ANON_PHONE}
      AND regexp_replace(customer_whatsapp, '\\D', '', 'g') = ${phoneDigits}
    RETURNING id
  `

  return { updated: result.length }
}

/** Anonimiza pedidos cuja última interação do titular excedeu o prazo de retenção. */
export async function anonymizeStaleCustomerData(
  retentionMonths = LGPD_RETENTION_MONTHS,
): Promise<{ updated: number }> {
  const result = await sql`
    WITH stale AS (
      SELECT store_id, regexp_replace(customer_whatsapp, '\\D', '', 'g') AS phone
      FROM orders
      WHERE customer_whatsapp != ${LGPD_ANON_PHONE}
      GROUP BY store_id, regexp_replace(customer_whatsapp, '\\D', '', 'g')
      HAVING MAX(created_at) < NOW() - (${retentionMonths}::int * INTERVAL '1 month')
    )
    UPDATE orders o
    SET
      customer_name = ${LGPD_ANON_NAME},
      customer_whatsapp = ${LGPD_ANON_PHONE},
      customer_email = NULL,
      customer_cpf_enc = NULL,
      notes = COALESCE(o.notes, '') || E'\n[LGPD] Retenção automática em ' || NOW()::text,
      delivery_address = NULL
    FROM stale s
    WHERE o.store_id = s.store_id
      AND regexp_replace(o.customer_whatsapp, '\\D', '', 'g') = s.phone
      AND o.customer_whatsapp != ${LGPD_ANON_PHONE}
    RETURNING o.id
  `

  return { updated: result.length }
}
