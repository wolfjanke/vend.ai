-- Expand theme_name CHECK to include flash, casual, social (10 themes total)
ALTER TABLE stores DROP CONSTRAINT IF EXISTS stores_theme_name_check;

ALTER TABLE stores
  ADD CONSTRAINT stores_theme_name_check
  CHECK (theme_name IN (
    'default', 'boutique', 'street', 'editorial', 'pop', 'fitness', 'lumiere',
    'flash', 'casual', 'social'
  ));
