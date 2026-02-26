import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env.local manually
const envPath = join(__dirname, '..', '.env.local')
const envContent = readFileSync(envPath, 'utf8')
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const [key, ...vals] = trimmed.split('=')
  if (key && vals.length) process.env[key.trim()] = vals.join('=').trim()
}

const sql = neon(process.env.DATABASE_URL)

async function setup() {
  console.log('🔧 Criando tabelas...')

  // Extension + Enum
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`

  await sql`DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('NOVO','CONFIRMADO','EM_ENTREGA','ENTREGUE','CANCELADO');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`

  // admin_users
  await sql`CREATE TABLE IF NOT EXISTS admin_users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    store_id      UUID,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`

  // stores
  await sql`CREATE TABLE IF NOT EXISTS stores (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID NOT NULL,
    slug          TEXT NOT NULL UNIQUE,
    name          TEXT NOT NULL,
    logo_url      TEXT,
    whatsapp      TEXT NOT NULL,
    settings_json JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT stores_slug_format CHECK (slug ~ '^[a-z0-9-]{2,40}$')
  )`

  await sql`CREATE INDEX IF NOT EXISTS stores_user_id_idx ON stores(user_id)`
  await sql`CREATE INDEX IF NOT EXISTS stores_slug_idx ON stores(slug)`

  // products
  await sql`CREATE TABLE IF NOT EXISTS products (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id      UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    description   TEXT NOT NULL DEFAULT '',
    category      TEXT NOT NULL DEFAULT 'outro',
    price         NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    promo_price   NUMERIC(10,2) CHECK (promo_price IS NULL OR promo_price >= 0),
    variants_json JSONB NOT NULL DEFAULT '[]'::JSONB,
    active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`

  await sql`CREATE INDEX IF NOT EXISTS products_store_id_idx ON products(store_id)`
  await sql`CREATE INDEX IF NOT EXISTS products_active_idx   ON products(store_id, active)`
  await sql`CREATE INDEX IF NOT EXISTS products_category_idx ON products(store_id, category)`

  // orders
  await sql`CREATE TABLE IF NOT EXISTS orders (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id          UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    order_number      TEXT NOT NULL,
    customer_name     TEXT NOT NULL,
    customer_whatsapp TEXT NOT NULL,
    items_json        JSONB NOT NULL DEFAULT '[]'::JSONB,
    total             NUMERIC(10,2) NOT NULL CHECK (total >= 0),
    notes             TEXT NOT NULL DEFAULT '',
    status            order_status NOT NULL DEFAULT 'NOVO',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`

  await sql`CREATE INDEX IF NOT EXISTS orders_store_id_idx ON orders(store_id)`
  await sql`CREATE INDEX IF NOT EXISTS orders_status_idx   ON orders(store_id, status)`
  await sql`CREATE INDEX IF NOT EXISTS orders_created_idx  ON orders(store_id, created_at DESC)`

  // Migrations: plan + recovery_sent_at (idempotent)
  await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'`
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS recovery_sent_at TIMESTAMPTZ NULL`
  try {
    await sql`ALTER TABLE stores ADD CONSTRAINT stores_plan_check CHECK (plan IN ('free','starter','pro','loja'))`
  } catch (e) {
    if (e?.code !== '42710') throw e // duplicate_object
  }

  console.log('✓ Tabelas criadas!')

  // ─── Seed: Loja ────────────────────────────────────────────────────────────
  console.log('🌱 Inserindo dados de exemplo...')

  // Admin user
  const passwordHash = await bcrypt.hash('admin123', 10)

  const existingUser = await sql`SELECT id FROM admin_users WHERE email = 'admin@bellamoda.com' LIMIT 1`

  let userId
  if (existingUser.length === 0) {
    const [newUser] = await sql`
      INSERT INTO admin_users (email, password_hash)
      VALUES ('admin@bellamoda.com', ${passwordHash})
      RETURNING id
    `
    userId = newUser.id
    console.log('✓ Admin user criado: admin@bellamoda.com / admin123')
  } else {
    userId = existingUser[0].id
    console.log('✓ Admin user já existe')
  }

  // Loja
  const existingStore = await sql`SELECT id FROM stores WHERE slug = 'bella-moda' LIMIT 1`

  let storeId
  if (existingStore.length === 0) {
    const [store] = await sql`
      INSERT INTO stores (user_id, slug, name, whatsapp)
      VALUES (${userId}, 'bella-moda', 'Bella Moda', '5511999999999')
      RETURNING id
    `
    storeId = store.id
    console.log('✓ Loja "Bella Moda" criada, slug: bella-moda')
  } else {
    storeId = existingStore[0].id
    console.log('✓ Loja já existe')
  }

  // Vincular admin à loja
  await sql`UPDATE admin_users SET store_id = ${storeId} WHERE id = ${userId}`

  // Produtos
  const existingProducts = await sql`SELECT COUNT(*) as c FROM products WHERE store_id = ${storeId}`
  if (Number(existingProducts[0].c) === 0) {
    const products = [
      {
        name: 'Vestido Midi Floral Manga Bufante',
        description: 'Vestido midi com estampa floral delicada e mangas bufantes. Ideal para looks românticos e encontros especiais.',
        category: 'vestido', price: 189.90, promo_price: null,
        variants_json: JSON.stringify([
          { id: 'v1', color: 'Rosa', colorHex: '#FFB6C1', photos: [], stock: { P: 3, M: 5, G: 2 } },
          { id: 'v2', color: 'Azul', colorHex: '#87CEEB', photos: [], stock: { P: 2, M: 4, G: 3 } },
        ]),
      },
      {
        name: 'Conjunto Cropped + Calça Wide Leg',
        description: 'Conjunto estiloso com cropped e calça wide leg. Perfeito para o dia a dia com muito estilo.',
        category: 'conjunto', price: 249.90, promo_price: 199.90,
        variants_json: JSON.stringify([
          { id: 'v3', color: 'Preto', colorHex: '#1a1a1a', photos: [], stock: { P: 4, M: 6, G: 4, GG: 2 } },
        ]),
      },
      {
        name: 'Blusa Cropped Ombro a Ombro',
        description: 'Blusa cropped com decote ombro a ombro super tendência. Combina com calças, saias e shorts.',
        category: 'blusa', price: 89.90, promo_price: null,
        variants_json: JSON.stringify([
          { id: 'v4', color: 'Branco', colorHex: '#FFFFFF', photos: [], stock: { PP: 2, P: 5, M: 7, G: 3 } },
          { id: 'v5', color: 'Nude', colorHex: '#D4A574', photos: [], stock: { PP: 1, P: 3, M: 4, G: 2 } },
        ]),
      },
      {
        name: 'Saia Midi Plissada',
        description: 'Saia midi plissada elegante e versátil. De looks casuais a formais, ela transforma qualquer visual.',
        category: 'saia', price: 129.90, promo_price: 109.90,
        variants_json: JSON.stringify([
          { id: 'v6', color: 'Verde Musgo', colorHex: '#6B7C5C', photos: [], stock: { P: 3, M: 5, G: 4 } },
          { id: 'v7', color: 'Vinho', colorHex: '#7B2D42', photos: [], stock: { P: 2, M: 3, G: 2 } },
        ]),
      },
      {
        name: 'Calça Pantalona Linho',
        description: 'Calça pantalona em linho premium para dias quentes. Conforto máximo com elegância.',
        category: 'calca', price: 169.90, promo_price: null,
        variants_json: JSON.stringify([
          { id: 'v8', color: 'Bege', colorHex: '#D2B48C', photos: [], stock: { P: 4, M: 6, G: 3, GG: 2 } },
        ]),
      },
      {
        name: 'Vestido Curto Canelado',
        description: 'Vestido curto em tecido canelado que molda o corpo perfeitamente. Prático, moderno e chique.',
        category: 'vestido', price: 139.90, promo_price: null,
        variants_json: JSON.stringify([
          { id: 'v9', color: 'Preto', colorHex: '#1a1a1a', photos: [], stock: { PP: 3, P: 5, M: 6, G: 4, GG: 2 } },
          { id: 'v10', color: 'Caramelo', colorHex: '#C68642', photos: [], stock: { PP: 1, P: 3, M: 4, G: 2 } },
        ]),
      },
    ]

    for (const p of products) {
      await sql`
        INSERT INTO products (store_id, name, description, category, price, promo_price, variants_json)
        VALUES (${storeId}, ${p.name}, ${p.description}, ${p.category}, ${p.price}, ${p.promo_price}, ${p.variants_json}::jsonb)
      `
    }
    console.log(`✓ ${products.length} produtos criados`)
  } else {
    console.log('✓ Produtos já existem')
  }

  // Pedidos
  const existingOrders = await sql`SELECT COUNT(*) as c FROM orders WHERE store_id = ${storeId}`
  if (Number(existingOrders[0].c) === 0) {
    const pedidos = [
      {
        order_number: 'BM-001',
        customer_name: 'Ana Silva',
        customer_whatsapp: '5511988887777',
        items_json: JSON.stringify([
          { product_id: 'p1', name: 'Vestido Midi Floral', size: 'M', color: 'Rosa', qty: 1, price: 189.90 }
        ]),
        total: 189.90,
        notes: 'Pode ser na cor rosa mesmo',
        status: 'NOVO',
      },
      {
        order_number: 'BM-002',
        customer_name: 'Juliana Costa',
        customer_whatsapp: '5521977776666',
        items_json: JSON.stringify([
          { product_id: 'p2', name: 'Conjunto Cropped + Wide Leg', size: 'P', color: 'Preto', qty: 1, price: 199.90 },
          { product_id: 'p3', name: 'Blusa Cropped', size: 'P', color: 'Branco', qty: 1, price: 89.90 },
        ]),
        total: 289.80,
        notes: '',
        status: 'CONFIRMADO',
      },
      {
        order_number: 'BM-003',
        customer_name: 'Mariana Rodrigues',
        customer_whatsapp: '5531966665555',
        items_json: JSON.stringify([
          { product_id: 'p5', name: 'Calça Pantalona Linho', size: 'G', color: 'Bege', qty: 1, price: 169.90 }
        ]),
        total: 169.90,
        notes: 'Entregar pela manhã',
        status: 'EM_ENTREGA',
      },
    ]

    for (const o of pedidos) {
      await sql`
        INSERT INTO orders (store_id, order_number, customer_name, customer_whatsapp, items_json, total, notes, status)
        VALUES (
          ${storeId}, ${o.order_number}, ${o.customer_name}, ${o.customer_whatsapp},
          ${o.items_json}::jsonb, ${o.total}, ${o.notes}, ${o.status}::order_status
        )
      `
    }
    console.log('✓ 3 pedidos criados (NOVO, CONFIRMADO, EM_ENTREGA)')
  } else {
    console.log('✓ Pedidos já existem')
  }

  console.log('\n✅ Banco de dados configurado com sucesso!')
  console.log('\n📝 Credenciais de acesso:')
  console.log('   URL: http://localhost:3000/admin')
  console.log('   Email: admin@bellamoda.com')
  console.log('   Senha: admin123')
  console.log('\n🛍️  Loja de exemplo:')
  console.log('   URL: http://localhost:3000/bella-moda')
}

setup().catch(err => {
  console.error('❌ Erro:', err)
  process.exit(1)
})
