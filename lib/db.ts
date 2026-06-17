import { neon } from '@neondatabase/serverless'

let _sql: ReturnType<typeof neon> | null = null

function isTransientDbError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error)
  const lower = msg.toLowerCase()
  return (
    lower.includes('fetch failed') ||
    lower.includes('connect timeout') ||
    lower.includes('econnreset') ||
    lower.includes('etimedout') ||
    lower.includes('socket hang up')
  )
}

async function withDbRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let last: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (error) {
      last = error
      if (!isTransientDbError(error) || i === attempts - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 350 * (i + 1)))
    }
  }
  throw last
}

function getSql(): ReturnType<typeof neon> {
  if (!_sql) {
    const url = process.env.DATABASE_URL
    if (!url) {
      throw new Error(
        'No database connection string was provided to neon(). Perhaps an environment variable has not been set?',
      )
    }
    _sql = neon(url, {
      // Evita que o Next.js tente cachear respostas HTTP do Neon (>2MB derruba o dev server).
      fetchOptions: { cache: 'no-store' },
    })
  }
  return _sql
}

// Lazy init: só conecta quando usar. Evita erro no build da Vercel (env não disponível na hora do import).
// Tipamos como retornando array para evitar erros de índice em todo o projeto.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SqlTag = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<any[]>

export const sql: SqlTag = ((strings: TemplateStringsArray, ...values: unknown[]) =>
  withDbRetry(() => getSql()(strings as unknown as TemplateStringsArray, ...values))) as SqlTag
