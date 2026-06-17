/** Datas de cobrança alinhadas ao calendário de São Paulo (Asaas usa YYYY-MM-DD). */
export const BILLING_TIMEZONE = 'America/Sao_Paulo'

/** YYYY-MM-DD no fuso de São Paulo. */
export function formatDateYmdBr(instant: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BILLING_TIMEZONE,
    year:    'numeric',
    month:   '2-digit',
    day:     '2-digit',
  }).format(instant)
}

/** Soma dias de calendário a partir da data BR do instante. */
export function addDaysBr(instant: Date, days: number): Date {
  const ymd = formatDateYmdBr(instant)
  const [y, m, d] = ymd.split('-').map(Number)
  const out = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
  out.setUTCDate(out.getUTCDate() + days)
  return out
}

/** ISO para persistir trial_ends_at (fim do último dia grátis ≈ meia-noite BR do dia da cobrança). */
export function firstChargeInstantFromYmd(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, 3, 0, 0))
}
