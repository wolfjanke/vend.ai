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

/** CPF mascarado 000.000.000-00 */
export function maskCpf(value: string): string {
  const d = digitsOnly(value).slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

/** Valida CPF (11 dígitos + dígitos verificadores) */
export function isValidCpf(value: string): boolean {
  const d = digitsOnly(value)
  if (d.length !== 11) return false
  if (/^(\d)\1{10}$/.test(d)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]!, 10) * (10 - i)
  let mod = (sum * 10) % 11
  if (mod === 10) mod = 0
  if (mod !== parseInt(d[9]!, 10)) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]!, 10) * (11 - i)
  mod = (sum * 10) % 11
  if (mod === 10) mod = 0
  return mod === parseInt(d[10]!, 10)
}
