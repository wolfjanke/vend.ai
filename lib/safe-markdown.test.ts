import { describe, expect, it } from 'vitest'
import { renderSafeMarkdown } from '@/lib/safe-markdown'

describe('renderSafeMarkdown', () => {
  it('rejeita links javascript:', () => {
    const html = renderSafeMarkdown('[x](javascript:alert(1))')
    expect(html).not.toContain('javascript:')
    expect(html).toContain('x')
    expect(html).not.toContain('<a ')
  })

  it('permite links https', () => {
    const html = renderSafeMarkdown('[site](https://vendai.club)')
    expect(html).toContain('href="https://vendai.club"')
    expect(html).toContain('site')
  })

  it('escapa tags HTML', () => {
    const html = renderSafeMarkdown('<script>alert(1)</script>')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })
})
