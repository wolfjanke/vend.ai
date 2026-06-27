# Checklist QA — cores da marca e temas

Use após alterações em aparência, `theme-ai`, `theme-page-bg` ou `theme-contrast`.

## Admin → Aparência

### Tema e swatches
- [ ] Cada card de tema exibe 3 bolinhas (primária, destaque, fundo padrão)
- [ ] Bloco “Cores padrão do tema [nome]” reflete o tema selecionado
- [ ] “Restaurar cores do tema” só aparece após personalizar alguma cor
- [ ] “Restaurar” volta primária, destaque e fundo ao padrão do layout atual

### Paletas rápidas
- [ ] Carrossel “Paletas rápidas” aplica 3 cores sem trocar o layout
- [ ] Preset ativo fica destacado quando as 3 cores batem

### Troca de tema
- [ ] Com cores padrão do tema atual → troca imediata + cores do novo tema
- [ ] Com cores personalizadas → modal com “Aplicar cores do tema” / “Manter minhas cores”
- [ ] “Manter minhas cores” troca só o layout; cores permanecem
- [ ] Clicar no mesmo tema não faz nada

### Contraste e harmonia
- [ ] Primária com baixo contraste no fundo → aviso + ajuste automático
- [ ] Destaque fraco nos cards → aviso + ajuste (usa fundo do card derivado)
- [ ] Fundo claro em tema só escuro (ex.: Viral) → aviso 💡 de harmonia
- [ ] Fundo escuro em tema só claro (ex.: Discovery) → aviso 💡 de harmonia
- [ ] Salvar com contraste ruim → mensagem WCAG informativa (não bloqueia)

### Marketplace
- [ ] Com layout Marketplace, nota sobre preço verde `#00A650` visível

### IA (planos pagos)
- [ ] Sugestões exibem 3 swatches (primária, destaque, fundo)
- [ ] Aplicar sugestão define tema + 3 hex (incluindo `pageBg`)
- [ ] Resposta legada só com `background` light/dark ainda resolve `pageBg`

## Vitrine pública

- [ ] Preview ao vivo reflete as 3 cores
- [ ] Loja publicada (`/{slug}`) usa fundo, cards e textos derivados
- [ ] Mobile 320px: carrosséis de tema/presets sem scroll horizontal acidental na página

## Regressão rápida

- [ ] `npm test -- lib/__tests__/theme-page-bg.test.ts lib/__tests__/theme-contrast.test.ts lib/__tests__/theme-ai.test.ts`
