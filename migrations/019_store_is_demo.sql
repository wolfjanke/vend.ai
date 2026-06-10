ALTER TABLE stores ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

UPDATE stores SET is_demo = true WHERE slug = 'urban-mix';
