-- Gênero gramatical do assistente (Vi, Leo, etc.)
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS assistant_gender TEXT DEFAULT 'feminine'
    CHECK (assistant_gender IN ('feminine', 'masculine', 'neutral'));
