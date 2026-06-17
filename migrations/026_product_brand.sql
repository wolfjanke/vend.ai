-- Migration 026: marca opcional do produto (separada do nome)
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT DEFAULT NULL;
