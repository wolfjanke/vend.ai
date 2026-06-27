-- Alerta de login em IP diferente do último acesso conhecido.
ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS last_login_ip TEXT DEFAULT NULL;
