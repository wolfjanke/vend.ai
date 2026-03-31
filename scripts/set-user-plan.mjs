import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

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

async function run() {
  const email = (process.argv[2] ?? '').trim().toLowerCase()
  const plan = (process.argv[3] ?? 'loja').trim()
  if (!email) {
    console.error('Uso: node scripts/set-user-plan.mjs <email> [plan]')
    process.exit(1)
  }

  const users = await sql`SELECT id, email, store_id FROM admin_users WHERE email = ${email} LIMIT 1`
  if (!users.length) {
    console.error('Usuário não encontrado:', email)
    process.exit(1)
  }
  const user = users[0]
  if (!user.store_id) {
    console.error('Usuário não possui store_id associado:', email)
    process.exit(1)
  }

  const before = await sql`SELECT id, name, slug, plan FROM stores WHERE id = ${user.store_id} LIMIT 1`
  if (!before.length) {
    console.error('Loja não encontrada para usuário:', email)
    process.exit(1)
  }

  await sql`UPDATE stores SET plan = ${plan} WHERE id = ${user.store_id}`
  const after = await sql`SELECT id, name, slug, plan FROM stores WHERE id = ${user.store_id} LIMIT 1`

  console.log('Usuário:', user.email)
  console.log('Loja antes:', before[0])
  console.log('Loja depois:', after[0])
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
