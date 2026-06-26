/**
 * Normaliza e-mails existentes para lowercase (rodar uma vez após deploy).
 * Uso: node scripts/migrate-normalize-emails.mjs
 */
import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const envPath = join(__dirname, '..', '.env.local')
const envContent = readFileSync(envPath, 'utf8')
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const [key, ...vals] = trimmed.split('=')
  if (key && vals.length) process.env[key.trim()] = vals.join('=').trim()
}

const sql = neon(process.env.DATABASE_URL)

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL ausente')
    process.exit(1)
  }

  const rows = await sql`
    SELECT id, email FROM admin_users
    WHERE email <> lower(trim(email))
  `

  console.log(`Encontrados ${rows.length} e-mails para normalizar.`)

  for (const row of rows) {
    const normalized = row.email.trim().toLowerCase()
    const conflict = await sql`
      SELECT id FROM admin_users WHERE email = ${normalized} AND id <> ${row.id} LIMIT 1
    `
    if (conflict.length > 0) {
      console.warn(`Conflito: ${row.email} → ${normalized} (já existe ${conflict[0].id})`)
      continue
    }
    await sql`UPDATE admin_users SET email = ${normalized} WHERE id = ${row.id}`
    console.log(`OK: ${row.email} → ${normalized}`)
  }

  console.log('Concluído.')
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
