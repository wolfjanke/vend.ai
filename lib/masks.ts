/** Remove não-dígitos */
export function digitsOnly(s: string): string {
  return s.replace(/\D/g, '')
}

/**
 * Formata telefone BR enquanto digita: (11) 99999-9999 ou (11) 9999-9999
 */
export function maskPhone(value: string): string {
  const d = digitsOnly(value).slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/** CEP 00000-000 */
export function maskCep(value: string): string {
  const d = digitsOnly(value).slice(0, 8)
  if (d.length <= 5) return d
  return `${d.slice(0, 5)}-${d.slice(5)}`
}

const BRL_FMT = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatCurrencyBRL(value: number): string {
  return BRL_FMT.format(value)
}

/**
 * Máscara monetária BR a partir de dígitos (centavos): digitar vira R$ 0,00 → R$ 12,34
 */
export function maskCurrencyFromDigits(raw: string): string {
  const digits = digitsOnly(raw)
  if (!digits) return ''
  const cents = parseInt(digits, 10)
  return BRL_FMT.format(cents / 100)
}

/** Converte string mascarada "R$ 1.234,56" ou dígitos para número */
export function parseCurrency(value: string): number {
  const digits = digitsOnly(value)
  if (!digits) return 0
  return parseInt(digits, 10) / 100
}

/** Número → string para input mascarado (ex.: DB → campo) */
export function numberToCurrencyInput(n: number): string {
  if (!Number.isFinite(n)) return BRL_FMT.format(0)
  const cents = Math.round(n * 100)
  return BRL_FMT.format(cents / 100)
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .substring(0, 40)
}

/** Valida telefone BR (só dígitos): 10 ou 11, DDD 11–99 */
export function isValidBrazilPhoneDigits(d: string): boolean {
  if (d.length !== 10 && d.length !== 11) return false
  const ddd = parseInt(d.slice(0, 2), 10)
  if (ddd < 11 || ddd > 99) return false
  return true
}
