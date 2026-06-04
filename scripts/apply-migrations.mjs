/**
 * Aplica todas as migrations em migrations/*.sql em ordem alfabética.
 * Idempotente: arquivos usam IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.
 */
import { Pool } from '@neondatabase/serverless'
import { readFileSync, readdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const migrationsDir = join(root, 'migrations')

function loadEnv() {
  const envPath = join(root, '.env.local')
  const envContent = readFileSync(envPath, 'utf8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim()
    if (key) process.env[key] = val
  }
}

async function main() {
  loadEnv()
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL não definida em .env.local')
    process.exit(1)
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()

  if (files.length === 0) {
    console.log('Nenhum arquivo .sql em migrations/')
    return
  }

  console.log(`🔧 Aplicando ${files.length} migration(s)…\n`)

  for (const file of files) {
    const path = join(migrationsDir, file)
    const content = readFileSync(path, 'utf8').trim()
    if (!content) {
      console.log(`⏭  ${file} (vazio)`)
      continue
    }
    process.stdout.write(`→ ${file} … `)
    try {
      await pool.query(content)
      console.log('ok')
    } catch (err) {
      console.log('erro')
      console.error(err)
      await pool.end()
      process.exit(1)
    }
  }

  await pool.end()
  console.log('\n✅ Migrations aplicadas com sucesso.')
}

main().catch(err => {
  console.error('❌', err)
  process.exit(1)
})
