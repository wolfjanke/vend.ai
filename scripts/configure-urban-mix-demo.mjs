/**
 * Configura Urban Mix como loja demo (tema Pop, Maya, slugs de produto).
 * Uso: node scripts/configure-urban-mix-demo.mjs
 */
import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '..', '.env.local')
try {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const [key, ...vals] = trimmed.split('=')
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim()
  }
} catch {
  console.warn('Aviso: .env.local não encontrado')
}

const sql = neon(process.env.DATABASE_URL)

function slugify(str) {
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .substring(0, 40)
}

function uniqueSlug(base, used) {
  let s = base || `produto-${Date.now()}`
  if (!used.has(s)) {
    used.add(s)
    return s
  }
  let n = 2
  while (used.has(`${s}-${n}`)) n++
  const out = `${s}-${n}`
  used.add(out)
  return out
}

async function main() {
  const wpp = (process.env.URBAN_MIX_WHATSAPP || '5511999999999').replace(/\D/g, '')

  const stores = await sql`SELECT id FROM stores WHERE slug = 'urban-mix' LIMIT 1`
  if (!stores.length) {
    console.error('Loja urban-mix não encontrada. Rode setup-db.mjs primeiro.')
    process.exit(1)
  }
  const storeId = stores[0].id

  await sql`
    UPDATE stores SET
      theme_name = 'pop',
      theme_primary_color = '#E94B88',
      theme_secondary_color = '#9B5DE5',
      theme_accent_color = '#FFB703',
      theme_background = 'light',
      theme_shimmer = false,
      theme_onboarding_done = true,
      assistant_name = 'Maya',
      assistant_welcome_message = 'Oi! 👋 Sou a Maya, da Urban Mix! Me conta o que você está procurando hoje — posso buscar por estilo, cor ou tamanho!',
      assistant_tone = 'playful',
      whatsapp = ${wpp},
      plan = COALESCE(plan, 'pro')
    WHERE slug = 'urban-mix'
  `
  console.log('✓ Loja urban-mix: tema Pop + Maya')

  const products = await sql`
    SELECT id, name, slug FROM products WHERE store_id = ${storeId}
  `
  const used = new Set(products.map(p => p.slug).filter(Boolean))
  for (const p of products) {
    if (p.slug?.trim()) continue
    const slug = uniqueSlug(slugify(p.name), used)
    await sql`UPDATE products SET slug = ${slug} WHERE id = ${p.id}`
    console.log(`  slug: ${p.name} → ${slug}`)
  }

  const existingNames = new Set(products.map(p => p.name))
  const extras = [
    {
      name: 'Top Cropped Listrado',
      category: 'blusa',
      price: 59.9,
      variants_json: [
        { id: 'ex1', color: 'Branco/Preto', colorHex: '#111111', photos: [], stock: { PP: 3, P: 5, M: 7, G: 4 } },
        { id: 'ex2', color: 'Rosa/Branco', colorHex: '#FFB6C1', photos: [], stock: { PP: 2, P: 4, M: 5, G: 3 } },
      ],
    },
    {
      name: 'Short Jeans Feminino',
      category: 'shorts',
      price: 79.9,
      variants_json: [
        { id: 'ex3', color: 'Azul Claro', colorHex: '#87CEEB', photos: [], stock: { '36': 4, '38': 6, '40': 5, '42': 2 } },
        { id: 'ex4', color: 'Preto', colorHex: '#1a1a1a', photos: [], stock: { '36': 3, '38': 4, '40': 3, '42': 1 } },
      ],
    },
  ]

  for (const ex of extras) {
    if (existingNames.has(ex.name)) continue
    const slug = uniqueSlug(slugify(ex.name), used)
    await sql`
      INSERT INTO products (store_id, name, slug, description, category, price, variants_json, active)
      VALUES (
        ${storeId},
        ${ex.name},
        ${slug},
        ${ex.name + ' — Urban Mix'},
        ${ex.category},
        ${ex.price},
        ${JSON.stringify(ex.variants_json)}::jsonb,
        true
      )
    `
    console.log(`✓ Produto extra: ${ex.name}`)
  }

  console.log('Concluído.')
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
