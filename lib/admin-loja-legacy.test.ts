import { describe, expect, it } from 'vitest'
import { resolveLegacyLojaSection } from './admin-loja-legacy'

describe('resolveLegacyLojaSection', () => {
  it('mapeia tabs antigas de Configurações', () => {
    expect(resolveLegacyLojaSection('config-conta')).toBe('conta')
    expect(resolveLegacyLojaSection('config-vi')).toBe('vi')
    expect(resolveLegacyLojaSection('config-venda')).toBe('venda')
    expect(resolveLegacyLojaSection('config-loja')).toBe('identidade')
  })

  it('mapeia hash e rotas legadas', () => {
    expect(resolveLegacyLojaSection('vi')).toBe('vi')
    expect(resolveLegacyLojaSection('aparencia', 'visual')).toBe('visual')
    expect(resolveLegacyLojaSection('marketing', 'promocoes')).toBe('promocoes')
  })

  it('usa fallback para valor desconhecido', () => {
    expect(resolveLegacyLojaSection('xyz', 'venda')).toBe('venda')
    expect(resolveLegacyLojaSection(null)).toBe('identidade')
  })
})
