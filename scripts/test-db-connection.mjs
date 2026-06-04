import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { neon } from '@neondatabase/serverless'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
for (const line of readFileSync(join(root, '.env.local'), 'utf8').split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eq = trimmed.indexOf('=')
  if (eq > 0) process.env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
}

const url = process.env.DATABASE_URL
if (!url) {
  console.error('ERRO: DATABASE_URL ausente em .env.local')
  process.exit(1)
}

const sql = neon(url)
const [row] = await sql`SELECT COUNT(*)::int AS stores FROM stores`
console.log('Conexão OK')
console.log('Pooler:', url.includes('-pooler'))
console.log('Lojas:', row.stores)
