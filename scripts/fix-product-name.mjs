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

  const result = await sql`
    UPDATE products
    SET name = 'Moletom Masculino'
    WHERE store_id = ${storeId} AND name ILIKE '%Moletom Cropped%'
    RETURNING name
  `
  if (result.length) {
    console.log(`✓ Nome atualizado para: "${result[0].name}"`)
  } else {
    console.log('Produto não encontrado')
  }
}

run().catch(err => { console.error(err); process.exit(1) })
