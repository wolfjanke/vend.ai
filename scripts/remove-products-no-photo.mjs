import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envContent = readFileSync(join(__dirname, '..', '.env.local'), 'utf8')
for (const line of envContent.split('\n')) {
  const t = line.trim()
  if (!t || t.startsWith('#')) continue
  const [k, ...v] = t.split('=')
  if (k && v.length) process.env[k.trim()] = v.join('=').trim()
}

const sql = neon(process.env.DATABASE_URL)

async function run() {
  const storeRows = await sql`SELECT id FROM stores WHERE slug = 'urban-mix' LIMIT 1`
  if (!storeRows.length) { console.error('Loja urban-mix não encontrada'); return }
  const storeId = storeRows[0].id

  // Remove produtos onde TODAS as variantes não têm foto
  const products = await sql`SELECT id, name, variants_json FROM products WHERE store_id = ${storeId}`

  let removed = 0
  for (const p of products) {
    const hasAnyPhoto = p.variants_json.some(v => v.photos && v.photos.length > 0)
    if (!hasAnyPhoto) {
      await sql`DELETE FROM products WHERE id = ${p.id}`
      console.log(`✗ Removido: "${p.name}"`)
      removed++
    }
  }

  if (removed === 0) console.log('Nenhum produto sem foto encontrado.')
  console.log(`\n✅ ${removed} produto(s) removido(s).`)
}

run().catch(err => { console.error(err); process.exit(1) })
