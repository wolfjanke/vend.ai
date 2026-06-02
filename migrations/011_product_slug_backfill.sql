-- Preenche slug vazio em produtos legados (URLs /produto/{slug})
UPDATE products
SET slug = id::text
WHERE slug IS NULL OR trim(slug) = '';
