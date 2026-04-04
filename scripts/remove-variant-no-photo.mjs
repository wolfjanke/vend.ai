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

  // Remove variantes sem foto de cada produto
  const products = await sql`SELECT id, name, variants_json FROM products WHERE store_id = ${storeId}`

  for (const p of products) {
    const withPhoto = p.variants_json.filter(v => v.photos && v.photos.length > 0)
    if (withPhoto.length === p.variants_json.length) continue // todas têm foto

    if (withPhoto.length === 0) {
      // sem nenhuma foto → remove o produto inteiro
      await sql`DELETE FROM products WHERE id = ${p.id}`
      console.log(`✗ Produto removido (sem fotos): "${p.name}"`)
    } else {
      // remove só as variantes sem foto
      await sql`UPDATE products SET variants_json = ${JSON.stringify(withPhoto)}::jsonb WHERE id = ${p.id}`
      const removed = p.variants_json.filter(v => !v.photos || v.photos.length === 0).map(v => v.color)
      console.log(`✓ "${p.name}" — variantes sem foto removidas: ${removed.join(', ')}`)
    }
  }

  console.log('\n✅ Limpeza concluída.')
}

run().catch(err => { console.error(err); process.exit(1) })
