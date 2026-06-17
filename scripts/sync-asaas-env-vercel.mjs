/**
 * Sincroniza variáveis Asaas do .env.local → Vercel Production.
 * Uso: node scripts/sync-asaas-env-vercel.mjs
 */
import { readFileSync, existsSync } from 'fs'
import { spawnSync } from 'child_process'

const ENV_FILE = '.env.local'
const TARGET = 'production'

const SET_VARS = [
  'ASAAS_ENV',
  'VENDAI_ASAAS_KEY',
  'VENDAI_ASAAS_WALLET_ID',
  'ASAAS_WEBHOOK_TOKEN',
  'SUBACCOUNT_ENCRYPTION_KEY',
]

const REMOVE_VARS = [
  'ASAAS_BASE_URL',
  'BILLING_TEST_EMAILS',
  'CHECKOUT_ENABLED',
]

function parseEnv(path) {
  const out = {}
  if (!existsSync(path)) throw new Error(`${path} não encontrado`)
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 1) continue
    const key = t.slice(0, i).trim()
    let val = t.slice(i + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    out[key] = val
  }
  return out
}

function vercel(args, stdin) {
  const r = spawnSync('npx', ['vercel', ...args], {
    input: stdin,
    encoding: 'utf8',
    shell: true,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  if (r.status !== 0) {
    const err = (r.stderr || r.stdout || '').trim()
    if (!err.includes('not found') && !err.includes('não encontrad')) {
      throw new Error(`vercel ${args.join(' ')}: ${err}`)
    }
  }
  return r
}

function rmVar(name) {
  vercel(['env', 'rm', name, TARGET, '--yes'])
}

function addVar(name, value) {
  if (!value) throw new Error(`${name} vazio no ${ENV_FILE}`)
  vercel(['env', 'add', name, TARGET, '--force'], value)
}

const env = parseEnv(ENV_FILE)

console.log(`Sincronizando Asaas → Vercel (${TARGET})…`)

for (const name of REMOVE_VARS) {
  console.log(`  removendo ${name}…`)
  rmVar(name)
}

for (const name of SET_VARS) {
  const value = env[name]
  if (!value) {
    console.warn(`  aviso: ${name} ausente em ${ENV_FILE}, pulando`)
    continue
  }
  console.log(`  definindo ${name}…`)
  rmVar(name)
  addVar(name, value)
}

console.log('Concluído. Rode: npx vercel --prod (ou redeploy no dashboard).')
