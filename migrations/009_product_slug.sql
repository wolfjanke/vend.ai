-- Slug de produto por loja (URLs da Vi e página de produto)
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug_store ON products(store_id, slug);
