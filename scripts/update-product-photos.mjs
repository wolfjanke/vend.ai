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

/**
 * Mapa: [nome do produto (ILIKE)] => { [cor] => caminho da foto em /public }
 * Adicione aqui cada imagem que o usuário fornecer.
 */
const PHOTO_MAP = [
  {
    name: '%Jaqueta Corta%',
    photos: {
      'Preto':       '/produtos/jaqueta-preto.png',
      'Verde Oliva': '/produtos/jaqueta-verde-oliva.png',
    },
  },
  {
    name: '%Camiseta Básica Oversized%',
    photos: {
      'Branco': '/produtos/camiseta-branco.png',
      'Preto':  '/produtos/camiseta-preto.png',
      'Cinza':  '/produtos/camiseta-cinza.png',
    },
  },
  {
    name: '%Vestido Midi Floral%',
    photos: {
      'Rosa': '/produtos/vestido-rosa.png',
    },
  },
  {
    name: '%Moletom Masculino%',
    photos: {
      'Cinza Mescla': '/produtos/moletom-cinza-mescla.png',
    },
  },
  {
    name: '%Calça Slim Jeans%',
    photos: {
      'Índigo': '/produtos/calca-indigo.png',
    },
  },
  {
    name: '%Blusa Cropped Ombro%',
    photos: {
      'Nude':   '/produtos/blusa-nude.png',
      'Branco': '/produtos/blusa-branco.png',
    },
  },
  {
    name: '%Saia Midi Plissada%',
    photos: {
      'Vinho':       '/produtos/saia-vinho.png',
      'Verde Musgo': '/produtos/saia-verde-musgo.png',
    },
  },
  {
    name: '%Bermuda Jogger%',
    photos: {
      'Cáqui': '/produtos/bermuda-caqui.png',
      'Preto': '/produtos/bermuda-preto.png',
    },
  },
]

async function run() {
  const storeRows = await sql`SELECT id FROM stores WHERE slug = 'urban-mix' LIMIT 1`
  if (!storeRows.length) { console.error('Loja urban-mix não encontrada'); return }
  const storeId = storeRows[0].id

  for (const entry of PHOTO_MAP) {
    const rows = await sql`
      SELECT id, name, variants_json
      FROM products
      WHERE store_id = ${storeId} AND name ILIKE ${entry.name}
      LIMIT 1
    `
    if (!rows.length) { console.log(`Produto "${entry.name}" não encontrado`); continue }
    const prod = rows[0]
    const updated = prod.variants_json.map(v => {
      const photo = entry.photos[v.color]
      if (photo) return { ...v, photos: [photo] }
      return v
    })
    await sql`UPDATE products SET variants_json = ${JSON.stringify(updated)}::jsonb WHERE id = ${prod.id}`
    console.log(`✓ "${prod.name}" atualizado:`, Object.keys(entry.photos).join(', '))
  }
  console.log('\n✅ Fotos atualizadas no banco!')
}

run().catch(err => { console.error(err); process.exit(1) })
