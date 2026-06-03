-- Migration 016: config global do SaaS + rastreio de login do lojista
CREATE TABLE IF NOT EXISTS global_config (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO global_config (key, value) VALUES
  ('plan_limits', '{
    "free": {"products": 10, "vi_messages": 1000},
    "starter": {"products": 25, "vi_messages": 5000},
    "pro": {"products": 200, "vi_messages": 15000},
    "loja": {"products": null, "vi_messages": 40000},
    "enterprise": {"products": null, "vi_messages": 60000}
  }'::jsonb),
  ('take_rates', '{
    "free": 4.5, "starter": 4.0, "pro": 2.75,
    "loja": 1.7, "enterprise": 1.5
  }'::jsonb),
  ('maintenance_mode', 'false'::jsonb),
  ('new_signups_enabled', 'true'::jsonb),
  ('support_email', '"suporte@vendai.club"'::jsonb)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS owner_email TEXT DEFAULT NULL;

UPDATE stores s
SET owner_email = u.email
FROM admin_users u
WHERE u.store_id = s.id
  AND s.owner_email IS NULL;
