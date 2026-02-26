import { neon } from '@neondatabase/serverless'

let _sql: ReturnType<typeof neon> | null = null

function getSql(): ReturnType<typeof neon> {
  if (!_sql) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('No database connection string was provided to neon(). Perhaps an environment variable has not been set?')
    _sql = neon(url)
  }
  return _sql
}

// Lazy init: só conecta quando usar. Evita erro no build da Vercel (env não disponível na hora do import).
// Tipamos como retornando array para evitar erros de índice em todo o projeto.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SqlTag = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<any[]>

export const sql: SqlTag = ((strings: TemplateStringsArray, ...values: unknown[]) =>
  getSql()(strings as unknown as TemplateStringsArray, ...values)) as SqlTag
