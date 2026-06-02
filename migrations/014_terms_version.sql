-- Migration 014: registro de aceite dos termos de uso
ALTER TABLE stores ADD COLUMN IF NOT EXISTS terms_version TEXT DEFAULT 'v1.0';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS terms_accepted_ip TEXT DEFAULT NULL;

UPDATE stores
SET
  terms_version = 'v1.0',
  terms_accepted_at = created_at,
  terms_accepted_ip = 'registro anterior'
WHERE terms_accepted_at IS NULL;
