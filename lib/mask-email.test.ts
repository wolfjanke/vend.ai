import { describe, expect, it } from 'vitest'
import { maskEmailForLog } from '@/lib/mask-email'

describe('maskEmailForLog', () => {
  it('mascara parte local mantendo domínio', () => {
    expect(maskEmailForLog('joao@gmail.com')).toBe('j**o@gmail.com')
  })

  it('normaliza maiúsculas', () => {
    expect(maskEmailForLog('  Ana@Mail.COM ')).toMatch(/@mail\.com$/)
  })
})
