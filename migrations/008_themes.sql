-- Configurações de tema por loja
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS theme_name TEXT DEFAULT 'default'
    CHECK (theme_name IN ('default','boutique','street','editorial','pop','fitness','lumiere')),
  ADD COLUMN IF NOT EXISTS theme_primary_color TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS theme_secondary_color TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS theme_accent_color TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS theme_background TEXT DEFAULT 'dark'
    CHECK (theme_background IN ('light','dark')),
  ADD COLUMN IF NOT EXISTS theme_shimmer BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS theme_logo_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS theme_onboarding_done BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_stores_theme ON stores(slug, theme_name);
