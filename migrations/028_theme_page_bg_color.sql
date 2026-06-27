-- Cor de fundo customizada da vitrine (3ª cor da marca)
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS theme_page_bg_color TEXT DEFAULT NULL;
