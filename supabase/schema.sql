-- ═══════════════════════════════════════════════════════════════════════════
-- vend.ai — Schema SQL para Supabase
-- Execute no SQL Editor: https://supabase.com/dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Enum: Status de Pedido ───────────────────────────────────────────────────
create type order_status as enum (
  'NOVO',
  'CONFIRMADO',
  'EM_ENTREGA',
  'ENTREGUE',
  'CANCELADO'
);

-- ─── Tabela: stores ───────────────────────────────────────────────────────────
create table if not exists stores (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  slug          text not null unique,
  name          text not null,
  logo_url      text,
  whatsapp      text not null,
  settings_json jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),

  constraint stores_slug_format check (slug ~ '^[a-z0-9-]{2,40}$')
);

create index if not exists stores_user_id_idx on stores(user_id);
create index if not exists stores_slug_idx    on stores(slug);

-- ─── Tabela: products ─────────────────────────────────────────────────────────
create table if not exists products (
  id            uuid primary key default uuid_generate_v4(),
  store_id      uuid not null references stores(id) on delete cascade,
  name          text not null,
  description   text not null default '',
  category      text not null default 'outro',
  price         numeric(10, 2) not null check (price >= 0),
  promo_price   numeric(10, 2) check (promo_price is null or promo_price >= 0),
  variants_json jsonb not null default '[]'::jsonb,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists products_store_id_idx  on products(store_id);
create index if not exists products_active_idx    on products(store_id, active);
create index if not exists products_category_idx  on products(store_id, category);

-- ─── Tabela: orders ───────────────────────────────────────────────────────────
create table if not exists orders (
  id                 uuid primary key default uuid_generate_v4(),
  store_id           uuid not null references stores(id) on delete cascade,
  order_number       text not null,
  customer_name      text not null,
  customer_whatsapp  text not null,
  items_json         jsonb not null default '[]'::jsonb,
  total              numeric(10, 2) not null check (total >= 0),
  notes              text not null default '',
  status             order_status not null default 'NOVO',
  created_at         timestamptz not null default now()
);

create index if not exists orders_store_id_idx on orders(store_id);
create index if not exists orders_status_idx   on orders(store_id, status);
create index if not exists orders_created_idx  on orders(store_id, created_at desc);

-- ─── Row Level Security (RLS) ─────────────────────────────────────────────────

-- stores
alter table stores enable row level security;

create policy "Lojista vê sua própria loja"
  on stores for select
  using (auth.uid() = user_id);

create policy "Qualquer um pode ver loja por slug (loja pública)"
  on stores for select
  using (true);

create policy "Lojista cria sua loja"
  on stores for insert
  with check (auth.uid() = user_id);

create policy "Lojista atualiza sua loja"
  on stores for update
  using (auth.uid() = user_id);

-- products
alter table products enable row level security;

create policy "Loja pública vê produtos ativos"
  on products for select
  using (
    active = true and
    exists (select 1 from stores where stores.id = products.store_id)
  );

create policy "Lojista vê todos os seus produtos"
  on products for select
  using (
    exists (select 1 from stores where stores.id = products.store_id and stores.user_id = auth.uid())
  );

create policy "Lojista gerencia seus produtos"
  on products for insert
  with check (
    exists (select 1 from stores where stores.id = store_id and stores.user_id = auth.uid())
  );

create policy "Lojista atualiza seus produtos"
  on products for update
  using (
    exists (select 1 from stores where stores.id = products.store_id and stores.user_id = auth.uid())
  );

create policy "Lojista remove seus produtos"
  on products for delete
  using (
    exists (select 1 from stores where stores.id = products.store_id and stores.user_id = auth.uid())
  );

-- orders
alter table orders enable row level security;

create policy "Qualquer um pode criar pedido"
  on orders for insert
  with check (true);

create policy "Lojista vê pedidos da sua loja"
  on orders for select
  using (
    exists (select 1 from stores where stores.id = orders.store_id and stores.user_id = auth.uid())
  );

create policy "Lojista atualiza status do pedido"
  on orders for update
  using (
    exists (select 1 from stores where stores.id = orders.store_id and stores.user_id = auth.uid())
  );

-- ─── Storage Bucket ──────────────────────────────────────────────────────────
-- Execute no Supabase Dashboard → Storage → New Bucket
-- Nome: product-photos | Public: true
-- Ou rode:
-- insert into storage.buckets (id, name, public) values ('product-photos', 'product-photos', true);

-- Policy para upload de fotos de produtos (lojistas autenticados)
-- create policy "Lojistas fazem upload"
--   on storage.objects for insert
--   to authenticated
--   with check (bucket_id = 'product-photos');

-- create policy "Fotos são públicas"
--   on storage.objects for select
--   to anon
--   using (bucket_id = 'product-photos');
