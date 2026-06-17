import { describe, expect, it } from 'vitest'
import { enrichViProductLinks } from '@/lib/vi-message-links'
import { renderSafeMarkdown } from '@/lib/safe-markdown'

const products = [
  {
    name:       'Camisa Masculina Gingham Xadrez Curta Polo',
    productUrl: 'https://vendai.club/loja-teste/produto/camisa-xadrez',
  },
  {
    name:       'Camisa Polo Masculina Tommy Hilfiger',
    productUrl: 'https://vendai.club/loja-teste/produto/polo-tommy',
  },
]

describe('enrichViProductLinks', () => {
  it('converte "Ver produto" solto em markdown com base na lista numerada', () => {
    const text = `Temos duas opções:

1 — **Camisa Masculina Gingham Xadrez Curta Polo**
De R$ 229,90 por R$ 179,90
👉 Ver produto

2 — **Camisa Polo Masculina Tommy Hilfiger**
De R$ 129,90 por R$ 89,90
👉 Ver produto`

    const enriched = enrichViProductLinks(text, products)
    expect(enriched).toContain('[Ver produto](https://vendai.club/loja-teste/produto/camisa-xadrez)')
    expect(enriched).toContain('[Ver produto](https://vendai.club/loja-teste/produto/polo-tommy)')
  })

  it('une linha Ver produto com URL na linha seguinte', () => {
    const text = `👉 Ver produto
https://vendai.club/loja-teste/produto/camisa-xadrez`
    const enriched = enrichViProductLinks(text, products)
    expect(enriched).toBe('👉 [Ver produto](https://vendai.club/loja-teste/produto/camisa-xadrez)')
  })
})

describe('renderSafeMarkdown', () => {
  it('rejeita links javascript:', () => {
    const html = renderSafeMarkdown('[x](javascript:alert(1))')
    expect(html).not.toContain('javascript:')
    expect(html).toContain('x')
    expect(html).not.toContain('<a ')
  })

  it('permite links https', () => {
    const html = renderSafeMarkdown('[Ver produto](https://vendai.club/loja/produto/x)')
    expect(html).toContain('href="https://vendai.club/loja/produto/x"')
    expect(html).toContain('Ver produto')
    expect(html).toContain('vi-message-link')
  })

  it('permite rotas internas da vitrine', () => {
    const html = renderSafeMarkdown('[Ver produto](/loja-teste/produto/camisa)')
    expect(html).toContain('href="/loja-teste/produto/camisa"')
    expect(html).not.toContain('target="_blank"')
  })

  it('escapa tags HTML', () => {
    const html = renderSafeMarkdown('<script>alert(1)</script>')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })
})
