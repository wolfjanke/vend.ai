/**
 * Verifica se a migration 009_themes_expand (flash, casual, social) está aplicada no Neon.
 * Uso: node scripts/check-theme-migration.mjs
 */
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
const required = ['flash', 'casual', 'social']

const rows = await sql`
  SELECT pg_get_constraintdef(c.oid) AS def
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  WHERE t.relname = 'stores'
    AND c.conname = 'stores_theme_name_check'
  LIMIT 1
`

const def = rows[0]?.def ?? ''
const missing = required.filter(slug => !def.includes(`'${slug}'`))

if (missing.length === 0) {
  console.log('OK: migration 009_themes_expand aplicada (flash, casual, social no CHECK)')
  process.exit(0)
}

console.error('PENDENTE: migration 009_themes_expand')
console.error('Slugs ausentes no CHECK stores_theme_name_check:', missing.join(', '))
console.error('Rode: npm run migrate')
process.exit(1)
