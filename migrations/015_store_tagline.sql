-- Slogan curto exibido no header da vitrine
ALTER TABLE stores ADD COLUMN IF NOT EXISTS tagline VARCHAR(60);
