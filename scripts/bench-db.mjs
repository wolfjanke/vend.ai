import { readFileSync } from 'fs'
import { neon } from '@neondatabase/serverless'

const env = readFileSync('.env.local', 'utf8')
const url = env.match(/^DATABASE_URL=(.+)$/m)?.[1]?.trim()
if (!url) {
  console.error('DATABASE_URL not found in .env.local')
  process.exit(1)
}

const sql = neon(url)

async function bench(label, fn) {
  const start = Date.now()
  await fn()
  return Date.now() - start
}

console.log('Neon latency from local machine:\n')

for (let i = 1; i <= 5; i++) {
  const ms = await bench(`ping ${i}`, () => sql`SELECT 1 as ok`)
  console.log(`  query ${i}: ${ms}ms`)
}

const parallel = Date.now()
await Promise.all([
  sql`SELECT name, slug, plan FROM stores LIMIT 1`,
  sql`SELECT COUNT(*)::int as c FROM orders WHERE status = 'NOVO'`,
  sql`SELECT COUNT(*)::int as c FROM products`,
  sql`SELECT * FROM products ORDER BY created_at DESC LIMIT 24`,
])
console.log(`\n  4 queries in parallel (typical admin page): ${Date.now() - parallel}ms`)

const seqStart = Date.now()
await sql`SELECT COUNT(*)::int as c FROM products WHERE store_id = ${'00000000-0000-0000-0000-000000000000'}`
await sql`SELECT * FROM products WHERE store_id = ${'00000000-0000-0000-0000-000000000000'} ORDER BY created_at DESC LIMIT 24`
await sql`SELECT settings_json, plan FROM stores WHERE id = ${'00000000-0000-0000-0000-000000000000'} LIMIT 1`
await sql`SELECT COUNT(*)::int as c FROM products WHERE store_id = ${'00000000-0000-0000-0000-000000000000'}`
console.log(`  4 queries sequential (produtos page today): ${Date.now() - seqStart}ms`)
