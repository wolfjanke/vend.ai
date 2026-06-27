import { describe, expect, it } from 'vitest'
import { buildContentSecurityPolicy } from '@/lib/csp'

describe('buildContentSecurityPolicy', () => {
  it('em produção usa nonce e strict-dynamic sem unsafe-eval no script-src', () => {
    const policy = buildContentSecurityPolicy('abc123', false)
    const scriptPart = policy.split(';').find(p => p.trim().startsWith('script-src')) ?? ''
    expect(scriptPart).toContain("'nonce-abc123'")
    expect(scriptPart).toContain("'strict-dynamic'")
    expect(scriptPart).not.toContain("'unsafe-eval'")
    expect(scriptPart).not.toContain("'unsafe-inline'")
    expect(policy).toContain('upgrade-insecure-requests')
    expect(policy).toContain('https://www.asaas.com')
  })

  it('em dev mantém unsafe-inline e unsafe-eval no script-src para HMR', () => {
    const policy = buildContentSecurityPolicy('abc123', true)
    const scriptPart = policy.split(';').find(p => p.trim().startsWith('script-src')) ?? ''
    expect(scriptPart).toContain("'unsafe-inline'")
    expect(scriptPart).toContain("'unsafe-eval'")
    expect(policy).not.toContain('upgrade-insecure-requests')
  })
})
