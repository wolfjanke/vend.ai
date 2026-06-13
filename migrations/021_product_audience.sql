-- Público-alvo do produto (inferido pela IA ou definido pelo lojista)
ALTER TABLE products ADD COLUMN IF NOT EXISTS audience TEXT;

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_audience_check;
ALTER TABLE products ADD CONSTRAINT products_audience_check
  CHECK (audience IS NULL OR audience IN ('feminine', 'masculine', 'unisex', 'kids'));

CREATE INDEX IF NOT EXISTS products_audience_idx ON products(store_id, audience);
