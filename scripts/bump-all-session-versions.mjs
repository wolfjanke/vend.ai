/**
 * Invalida todos os JWTs ativos incrementando session_version em massa.
 * Rode UMA VEZ após deploy que introduz session_version / endurecimento de auth.
 *
 * Uso: npm run auth:revoke-all-sessions
 */
import { Pool } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

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

  const force = process.argv.includes('--yes')
  if (!force) {
    console.log(
      '⚠️  Isso deslogará TODOS os usuários (JWTs antigos ficam inválidos).\n' +
        '    Confirme com: npm run auth:revoke-all-sessions -- --yes',
    )
    process.exit(0)
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    const before = await pool.query(
      'SELECT COUNT(*)::int AS c, MIN(session_version)::int AS min_v, MAX(session_version)::int AS max_v FROM admin_users',
    )
    const row = before.rows[0]
    console.log(
      `Usuários: ${row.c} | session_version atual min=${row.min_v} max=${row.max_v}`,
    )

    const updated = await pool.query(`
      UPDATE admin_users
      SET session_version = COALESCE(session_version, 1) + 1
      RETURNING id
    `)

    const after = await pool.query(
      'SELECT MIN(session_version)::int AS min_v, MAX(session_version)::int AS max_v FROM admin_users',
    )
    console.log(
      `✅ ${updated.rowCount} usuário(s) atualizado(s). Nova faixa: min=${after.rows[0].min_v} max=${after.rows[0].max_v}`,
    )
  } finally {
    await pool.end()
  }
}

main().catch(e => {
  console.error('❌', e)
  process.exit(1)
})
