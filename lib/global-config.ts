import { sql } from '@/lib/db'

const cache = new Map<string, { value: unknown; at: number }>()
const TTL_MS = 30_000

export async function getGlobalConfig<T = unknown>(key: string): Promise<T | null> {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value as T

  try {
    const rows = await sql`
      SELECT value FROM global_config WHERE key = ${key} LIMIT 1
    `
    if (!rows[0]) return null
    const value = rows[0].value as T
    cache.set(key, { value, at: Date.now() })
    return value
  } catch {
    return null
  }
}

export async function setGlobalConfig(key: string, value: unknown): Promise<void> {
  await sql`
    INSERT INTO global_config (key, value, updated_at)
    VALUES (${key}, ${JSON.stringify(value)}::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE SET
      value = EXCLUDED.value,
      updated_at = NOW()
  `
  cache.delete(key)
}

export function clearGlobalConfigCache(): void {
  cache.clear()
}
