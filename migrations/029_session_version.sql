-- Invalidação de sessão JWT no logout e troca de senha (sessionVer no token).
ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 1;

UPDATE admin_users
SET session_version = 1
WHERE session_version IS NULL;
