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
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2)`
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_pix NUMERIC(10,2)`
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_coupon NUMERIC(10,2)`
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_total NUMERIC(10,2)`
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_final NUMERIC(10,2)`
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT`
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code_applied TEXT`
  try {
    await sql`ALTER TABLE stores ADD CONSTRAINT stores_plan_check CHECK (plan IN ('free','starter','pro','loja'))`
  } catch (e) {
    if (e?.code !== '42710') throw e // duplicate_object
  }

  // Endereço da loja + entrega + recuperação de senha
  await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS cep VARCHAR(12)`
  await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS logradouro TEXT`
  await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS numero VARCHAR(30)`
  await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS complemento TEXT`
  await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS bairro TEXT`
  await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS cidade TEXT`
  await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS uf CHAR(2)`

  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address JSONB`

  await sql`CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    token         TEXT NOT NULL UNIQUE,
    expires_at    TIMESTAMPTZ NOT NULL,
    used_at       TIMESTAMPTZ NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`
  await sql`CREATE INDEX IF NOT EXISTS password_reset_tokens_token_idx ON password_reset_tokens(token)`
  await sql`CREATE INDEX IF NOT EXISTS password_reset_tokens_user_idx ON password_reset_tokens(user_id)`

  // Migration 005: Asaas checkout integration
  await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS asaas_account_id       VARCHAR(64)`
  await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS asaas_wallet_id        VARCHAR(64)`
  await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS asaas_api_key_enc      TEXT`
  await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS asaas_onboarding_status VARCHAR(32) DEFAULT 'PENDING'`
  await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS asaas_onboarding_url   TEXT`
  await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS asaas_approved_at      TIMESTAMPTZ`
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_source          VARCHAR(16)`
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS asaas_payment_id        VARCHAR(64)`
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS asaas_installment_id    VARCHAR(64)`
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS checkout_gross_value    DECIMAL(10,2)`
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS checkout_installment_count INT`
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS checkout_installment_value DECIMAL(10,2)`
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS platform_fee_pct        DECIMAL(5,4)`
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS platform_fee_amount     DECIMAL(10,2)`
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS asaas_split_status      VARCHAR(32)`
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status          VARCHAR(32)`
  await sql`CREATE TABLE IF NOT EXISTS webhook_events_asaas (
    id           SERIAL PRIMARY KEY,
    event_id     VARCHAR(128) UNIQUE NOT NULL,
    event_type   VARCHAR(64),
    payload      JSONB,
    processed_at TIMESTAMPTZ DEFAULT NOW()
  )`

  console.log('✓ Tabelas criadas!')

  // ─── Seed: Loja Demo ───────────────────────────────────────────────────────
  console.log('🌱 Inserindo dados de exemplo...')

  // Admin user
  const passwordHash = await bcrypt.hash('admin123', 10)

  const existingUser = await sql`SELECT id FROM admin_users WHERE email = 'admin@urbanmix.com' LIMIT 1`

  let userId
  if (existingUser.length === 0) {
    const [newUser] = await sql`
      INSERT INTO admin_users (email, password_hash)
      VALUES ('admin@urbanmix.com', ${passwordHash})
      RETURNING id
    `
    userId = newUser.id
    console.log('✓ Admin user criado: admin@urbanmix.com / admin123')
  } else {
    userId = existingUser[0].id
    console.log('✓ Admin user já existe')
  }

  // Configurações da loja demo com PIX 5%, frete e perfil unissex
  const demoSettings = JSON.stringify({
    freteInfo: 'Frete grátis para compras acima de R$ 199. Entregamos em todo Brasil em até 7 dias úteis.',
    pagamentoInfo: 'PIX (5% de desconto), cartão de crédito em até 3x sem juros. Dinheiro na retirada.',
    pixDiscountPercent: 5,
    genderFocus: 'unisex',
    ageGroup: 'adult',
    installmentsMaxNoInterest: 3,
  })

  // Loja
  const existingStore = await sql`SELECT id FROM stores WHERE slug = 'urban-mix' LIMIT 1`

  let storeId
  if (existingStore.length === 0) {
    const [store] = await sql`
      INSERT INTO stores (user_id, slug, name, whatsapp, settings_json)
      VALUES (${userId}, 'urban-mix', 'Urban Mix', '5511999999999', ${demoSettings}::jsonb)
      RETURNING id
    `
    storeId = store.id
    console.log('✓ Loja "Urban Mix" criada, slug: urban-mix')
  } else {
    storeId = existingStore[0].id
    // Garantir que o settings_json está atualizado mesmo se a loja já existia
    await sql`UPDATE stores SET settings_json = ${demoSettings}::jsonb WHERE id = ${storeId}`
    console.log('✓ Loja já existe (settings_json atualizado)')
  }

  // Vincular admin à loja
  await sql`UPDATE admin_users SET store_id = ${storeId} WHERE id = ${userId}`

  // Produtos
  const existingProducts = await sql`SELECT COUNT(*) as c FROM products WHERE store_id = ${storeId}`
  if (Number(existingProducts[0].c) === 0) {
    const products = [
      // ── Femininos ────────────────────────────────────────────────────────────
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
        name: 'Saia Midi Plissada',
        description: 'Saia midi plissada elegante e versátil. De looks casuais a formais, ela transforma qualquer visual.',
        category: 'saia', price: 129.90, promo_price: 109.90,
        variants_json: JSON.stringify([
          { id: 'v4', color: 'Verde Musgo', colorHex: '#6B7C5C', photos: [], stock: { P: 3, M: 5, G: 4 } },
          { id: 'v5', color: 'Vinho', colorHex: '#7B2D42', photos: [], stock: { P: 2, M: 3, G: 2 } },
        ]),
      },
      {
        name: 'Blusa Cropped Ombro a Ombro',
        description: 'Blusa cropped com decote ombro a ombro super tendência. Combina com calças, saias e shorts.',
        category: 'blusa', price: 89.90, promo_price: null,
        variants_json: JSON.stringify([
          { id: 'v6', color: 'Branco', colorHex: '#FFFFFF', photos: [], stock: { PP: 2, P: 5, M: 7, G: 3 } },
          { id: 'v7', color: 'Nude', colorHex: '#D4A574', photos: [], stock: { PP: 1, P: 3, M: 4, G: 2 } },
        ]),
      },
      // ── Masculinos ───────────────────────────────────────────────────────────
      {
        name: 'Camiseta Básica Oversized',
        description: 'Camiseta oversized em algodão premium. Corte confortável e moderno, perfeita para o dia a dia.',
        category: 'camiseta', price: 79.90, promo_price: null,
        variants_json: JSON.stringify([
          { id: 'v8', color: 'Preto', colorHex: '#1a1a1a', photos: [], stock: { P: 5, M: 8, G: 6, GG: 3 } },
          { id: 'v9', color: 'Branco', colorHex: '#FFFFFF', photos: [], stock: { P: 4, M: 7, G: 5, GG: 2 } },
          { id: 'v10', color: 'Cinza', colorHex: '#888888', photos: [], stock: { P: 3, M: 6, G: 4, GG: 2 } },
        ]),
      },
      {
        name: 'Bermuda Jogger Cargo',
        description: 'Bermuda jogger com bolsos cargo laterais. Estilo streetwear com muito conforto para o verão.',
        category: 'bermuda', price: 119.90, promo_price: 99.90,
        variants_json: JSON.stringify([
          { id: 'v11', color: 'Cáqui', colorHex: '#C3A882', photos: [], stock: { P: 4, M: 6, G: 5, GG: 2 } },
          { id: 'v12', color: 'Preto', colorHex: '#1a1a1a', photos: [], stock: { P: 3, M: 5, G: 4, GG: 2 } },
        ]),
      },
      {
        name: 'Moletom Masculino',
        description: 'Moletom com capuz em moletinho flanelado. Quentinho, estiloso e versátil para as estações mais frias.',
        category: 'moletom', price: 149.90, promo_price: null,
        variants_json: JSON.stringify([
          { id: 'v13', color: 'Cinza Mescla', colorHex: '#9E9E9E', photos: [], stock: { P: 3, M: 5, G: 4, GG: 1 } },
          { id: 'v14', color: 'Azul Marinho', colorHex: '#1A237E', photos: [], stock: { P: 2, M: 4, G: 3, GG: 2 } },
        ]),
      },
      {
        name: 'Calça Slim Jeans',
        description: 'Calça slim em jeans lavagem escura. Modelagem ajustada que valoriza o corpo com elegância casual.',
        category: 'calca', price: 189.90, promo_price: null,
        variants_json: JSON.stringify([
          { id: 'v15', color: 'Índigo', colorHex: '#3F51B5', photos: [], stock: { 38: 3, 40: 5, 42: 6, 44: 4, 46: 2 } },
        ]),
      },
      // ── Unissex ──────────────────────────────────────────────────────────────
      {
        name: 'Jaqueta Corta-Vento Unissex',
        description: 'Jaqueta corta-vento leve com capuz e refletivos. Ideal para atividades ao ar livre e looks urbanos.',
        category: 'casaco', price: 229.90, promo_price: 189.90,
        variants_json: JSON.stringify([
          { id: 'v16', color: 'Preto', colorHex: '#1a1a1a', photos: [], stock: { P: 3, M: 5, G: 4, GG: 2 } },
          { id: 'v17', color: 'Verde Oliva', colorHex: '#556B2F', photos: [], stock: { P: 2, M: 4, G: 3, GG: 1 } },
        ]),
      },
      {
        name: 'Camiseta Tie-Dye Unissex',
        description: 'Camiseta com estampa tie-dye artesanal. Cada peça é única — estilo descolado para qualquer gênero.',
        category: 'camiseta', price: 69.90, promo_price: null,
        variants_json: JSON.stringify([
          { id: 'v18', color: 'Rosa/Roxo', colorHex: '#C471ED', photos: [], stock: { P: 4, M: 6, G: 5, GG: 2 } },
          { id: 'v19', color: 'Azul/Turquesa', colorHex: '#00BCD4', photos: [], stock: { P: 3, M: 5, G: 4, GG: 2 } },
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
        order_number: 'UM-001',
        customer_name: 'Carlos Mendes',
        customer_whatsapp: '5511988887777',
        items_json: JSON.stringify([
          { product_id: 'p1', name: 'Camiseta Básica Oversized', size: 'M', color: 'Preto', qty: 2, price: 79.90 }
        ]),
        total: 159.80,
        notes: 'Quero os dois na cor preta mesmo',
        status: 'NOVO',
      },
      {
        order_number: 'UM-002',
        customer_name: 'Fernanda Lima',
        customer_whatsapp: '5521977776666',
        items_json: JSON.stringify([
          { product_id: 'p2', name: 'Conjunto Cropped + Wide Leg', size: 'P', color: 'Preto', qty: 1, price: 199.90 },
          { product_id: 'p3', name: 'Saia Midi Plissada', size: 'P', color: 'Verde Musgo', qty: 1, price: 109.90 },
        ]),
        total: 309.80,
        notes: 'Paguei no PIX com 5% de desconto',
        status: 'CONFIRMADO',
      },
      {
        order_number: 'UM-003',
        customer_name: 'Rafael Santos',
        customer_whatsapp: '5531966665555',
        items_json: JSON.stringify([
          { product_id: 'p4', name: 'Jaqueta Corta-Vento Unissex', size: 'G', color: 'Verde Oliva', qty: 1, price: 189.90 },
          { product_id: 'p5', name: 'Bermuda Jogger Cargo', size: 'G', color: 'Cáqui', qty: 1, price: 99.90 },
        ]),
        total: 289.80,
        notes: 'Entregar pela manhã se possível',
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
  console.log('   Email: admin@urbanmix.com')
  console.log('   Senha: admin123')
  console.log('\n🛍️  Loja de exemplo:')
  console.log('   URL: http://localhost:3000/urban-mix')
}

setup().catch(err => {
  console.error('❌ Erro:', err)
  process.exit(1)
})
