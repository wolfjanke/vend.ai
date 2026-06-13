-- Eixos de catálogo (cor/modelo + grade de estoque) por produto
ALTER TABLE products ADD COLUMN IF NOT EXISTS catalog_axes JSONB;
