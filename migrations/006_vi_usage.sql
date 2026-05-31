-- Contadores de uso da Vi (rate limit por loja)
CREATE TABLE IF NOT EXISTS vi_usage (
  store_id    UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  period_key  TEXT NOT NULL,
  msg_count   INT  NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (store_id, period_key)
);

CREATE INDEX IF NOT EXISTS vi_usage_period_idx ON vi_usage(period_key);
