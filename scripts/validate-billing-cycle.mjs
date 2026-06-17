import { readFileSync } from 'fs'

try {
  const env = readFileSync('.env.local', 'utf8')
  for (const line of env.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
  }
} catch {
  /* optional */
}

const proMonthly = 5990
const quarterly = Math.round(proMonthly * 3 * 0.9)
const annual = Math.round(proMonthly * 12 * 0.8)

console.log('Pricing math (Pro):')
console.log(`  monthly: R$ ${(proMonthly / 100).toFixed(2)}`)
console.log(`  quarterly charge: R$ ${(quarterly / 100).toFixed(2)} (display/mo: R$ ${(Math.round(quarterly / 3) / 100).toFixed(2)})`)
console.log(`  annual charge: R$ ${(annual / 100).toFixed(2)} (display/mo: R$ ${(Math.round(annual / 12) / 100).toFixed(2)})`)

const key = process.env.VENDAI_ASAAS_KEY || process.env.ASAAS_API_KEY
if (!key) {
  console.log('Sandbox API: skipped (no VENDAI_ASAAS_KEY)')
  process.exit(0)
}

const base = (process.env.ASAAS_ENV ?? 'sandbox') === 'production'
  ? 'https://api.asaas.com/v3'
  : 'https://sandbox.asaas.com/api/v3'

for (const [cycle, value] of [['QUARTERLY', quarterly / 100], ['YEARLY', annual / 100]]) {
  const res = await fetch(`${base}/subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      access_token: key,
      'User-Agent': 'vendai.club/1.0',
    },
    body: JSON.stringify({
      customer: 'cus_invalid_cycle_test',
      billingType: 'UNDEFINED',
      value,
      nextDueDate: '2026-07-01',
      cycle,
      description: 'vendai.club billing cycle validation',
      externalReference: 'test-billing-cycle',
    }),
  })
  const body = await res.json().catch(() => ({}))
  const err = body?.errors?.[0]?.description
  if (res.ok) {
    console.log(`Asaas ${cycle}: accepted value R$ ${value}`)
  } else if (err?.toLowerCase().includes('cliente') || err?.toLowerCase().includes('customer')) {
    console.log(`Asaas ${cycle}: cycle accepted by API (customer error expected: ${err})`)
  } else {
    console.log(`Asaas ${cycle}: ${err ?? `HTTP ${res.status}`}`)
  }
}
