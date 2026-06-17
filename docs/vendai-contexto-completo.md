# vendai.club — Contexto completo do produto

Documento consolidado para alinhar time, IA e parceiros. Última atualização: junho/2026.

---

## 1. Visão e eixo de produto

**vendai.club** é uma vitrine online com IA para quem vende moda no Instagram e WhatsApp — deliberadamente **não** uma "loja online completa" com checkout obrigatório.

| Pilar | O que é |
|-------|---------|
| **Vitrine** | Catálogo com link próprio, estoque por SKU, mobile-first |
| **Vi** | Assistente com IA que atende 24h na loja |
| **WhatsApp** | Pedido formatado chega no WhatsApp do lojista |

**Jornada da lojista:** dor no Direct do Instagram → cliente navega na vitrine → Vi responde com estoque → pedido formatado no WhatsApp.

**Empresa:** Wolf Hub Desenvolvimento de Software Não Customizável Ltda  
**Domínio oficial:** https://vendai.club  
**Não confundir com:** vendeai.io (VendeAI) — produto diferente.

---

## 2. Posicionamento na landing (jun/2026)

### Decisão

Hero **híbrido (opção C3)**: fala com tráfego frio (dor no Direct) e com intenção de busca ("vitrine de moda") ao mesmo tempo.

Alternativas descartadas:
- **B** — H1 100% emocional (perde SEO/categoria)
- **A** — H1 vitrine + dor só no sub (ads pagos não garantem leitura do sub)
- **C1/C2** — mais genérico ou Vi no H1 antes da marca ser reconhecida

### Copy travado (hero)

| Elemento | Texto |
|----------|-------|
| Badge | Vitrine + Vi — para quem vende moda no Instagram e WhatsApp |
| **H1** | Sua vitrine de moda no ar — com IA que responde o Direct por você |
| **Sub** | Catálogo no ar em minutos. A Vi responde com seu estoque e manda o pedido formatado no WhatsApp — sem marketplace, sem complicação. |
| CTA primário | Criar minha loja grátis |

**Rationale:** "Direct" é a palavra que a persona usa no dia a dia; o sub fecha com WhatsApp (onde a Vi de fato entrega o pedido). `SITE_TITLE` mantém keywords para orgânico; meta description reforça a jornada Direct → WhatsApp.

### FAQ estratégico

Pergunta *"Qual a diferença de vitrine e loja online?"* — gancho para educar e plantar semente da Fase 3 (checkout integrado, quando ligado).

### Arquivos de copy

- `app/page.tsx` — hero, bullets, CTA final
- `lib/site-seo.ts` — title, description, tagline, keywords
- `lib/landing-faq.ts` — FAQ (fonte única UI + JSON-LD)
- `public/llms.txt` — crawlers de IA
- `components/landing/LandingHeroMobile.tsx` — mock com "Tem no P?"

---

## 3. Trial e billing (Asaas)

### Regras

- Trial **somente na 1ª assinatura paga** (`isFirstPaidSubscription` via `billing_history` sem `SUBSCRIPTION_CREATED`)
- **Intencional:** cancelou e voltou → **sem trial novo**
- Upgrade durante trial ativo → preserva `trial_ends_at`
- Dias por plano (1ª assinatura): Starter/Pro/Loja 14, Enterprise 30. Grátis = descoberta (10 produtos) sem trial pago.

### Arquivos

| Arquivo | Função |
|---------|--------|
| `lib/billing-dates.ts` | Cálculo de datas |
| `lib/billing-trial.ts` | Elegibilidade e sync trial |
| `lib/billing-trial.test.ts` | Testes unitários |
| `lib/payments/subscriptions.ts` | Criação/atualização assinatura |
| `lib/payments/wolf-hub.ts` | `updateSubscriptionAsaas` |
| `app/admin/plano/PlanoClient.tsx` | UI trial nos cards |

---

## 4. Checkout integrado (código pronto, desligado)

Checkout com pricing de cupom/PIX alinhado ao fluxo WhatsApp foi **adiantado** junto com Marketing — mas permanece **off** em produção até decisão de produto.

| Flag / config | Estado |
|---------------|--------|
| `CHECKOUT_ENABLED` | `false` |
| `checkoutEnabled: false` em planos | Desligado |

### Arquivos

- `lib/checkout-enabled.ts`
- `lib/checkout/marketing-pricing.ts` — mesmo pricing cupom/PIX
- `lib/checkout/handlers.ts` — valida `payableValue`
- `components/checkout/*`, `CheckoutForm`, `CheckoutWrapper`, `OrderSummary`
- `components/loja/Carrinho.tsx` — sessionStorage cupom

**Fase 3:** ligar flags + planos quando vitrine → loja online com checkout for prioridade.

---

## 5. Marketing e banners

### Estado atual

- Banner: **texto** + toggle **pulsação** (`banner-motion-pulse`)
- Preview no admin + **Gerar com Vi** (`lib/banner-ai.ts`, `app/api/admin/marketing/banner-text/route.ts`)
- Rotação entre mensagens (6s) se múltiplos banners ativos
- **Sem marquee** — decisão consciente após testes

### Roadmap imagem

- `BANNER_IMAGE_ROADMAP_MIN_ACTIVE_STORES = 10` em `lib/banners.ts`
- Conta lojas **ACTIVE** (não demo) via `countActiveStoresForBannerRoadmap()`
- UI de upload de imagem só quando critério atingido

### Arquivos

- `app/admin/marketing/MarketingForm.tsx`
- `components/loja/BannerStrip.tsx`
- `lib/banners.ts`

---

## 6. Admin e UX recentes

| Mudança | Detalhe |
|---------|---------|
| Configurações | 4 abas via `ConfigSectionNav` |
| Alertas de estoque | `StockAlertsSettings.tsx` em `/admin/produtos` |
| Dashboard | Quick actions redundantes removidos; "Ver loja" no mobile |
| Filtro categoria | `app/admin/produtos/page.tsx` |
| ViChat | Fix `showSuggestions` state |

---

## 7. Vi (assistente IA)

- Atende na vitrine: estoque, estilo, tamanho, pagamento
- Limites por plano (Grátis: 500 msgs/mês; excedente redireciona ao WhatsApp no Grátis)
- Links em mensagens: `lib/vi-message-links.ts`
- Cadastro com IA (foto → nome/descrição/categoria): planos pagos

---

## 8. Planos (resumo)

| Plano | Preço/mês | Produtos | Msgs Vi/mês |
|-------|-----------|----------|-------------|
| Grátis | R$ 0 | 10 | 500 |
| Starter | R$ 39,90 | 50 | 3.000 |
| Pro | R$ 59,90 | 200 | — |
| Loja | R$ 99,90 | Ilimitado | — |
| Enterprise | R$ 199,90 | Ilimitado | — |

Detalhes e trial por plano: landing `#planos` e `lib/plans.ts`.

---

## 9. Mapa rápido de arquivos

```
app/page.tsx                    # Landing
lib/site-seo.ts                 # SEO centralizado
lib/landing-faq.ts              # FAQ
lib/brand.ts                    # Marca vendai.club
lib/billing-trial.ts            # Trial
lib/checkout-enabled.ts         # Flag checkout
lib/checkout/marketing-pricing.ts
lib/banners.ts                  # Banners + roadmap imagem
lib/banner-ai.ts                # Geração texto Vi
components/landing/*            # Hero, plans, sticky CTA
lib/vi-readiness.ts            # Score catálogo / Vi pronta
app/admin/marketing/            # Painel marketing
```

---

## 10. Vi readiness (onboarding de catálogo)

Risco de churn silencioso: lojista cadastra mal → Vi responde mal → abandono sem ticket.

### Implementado (jun/2026)

| Item | Detalhe |
|------|---------|
| `lib/vi-readiness.ts` | Score por produto (foto, preço, estoque) + relatório da loja |
| `ViReadinessCard` | Painel "Sua Vi está pronta?" no dashboard |
| Mínimo | 3 produtos ativos completos para status **Pronta** |
| `/cadastro` passo 3 | Copy honesta no grátis (sem prometer IA na foto) |
| Superadmin | Lojas com &lt; 3 produtos ativos; novas 48h sem pedido + catálogo fraco |

### Roadmap

- E-mail D+2 para lojas com readiness baixo
- Wizard no primeiro produto (foto → preço → estoque)

---

## 11. Próximos passos possíveis

1. **Ads:** testar C3 no Instagram com criativo espelhando H1 + mock "Tem no P?"
2. **Checkout:** ligar quando ≥ N lojas pedirem ou Fase 3 for priorizada
3. **Banner imagem:** implementar upload quando `countActiveStoresForBannerRoadmap() >= 10`
4. **OG image:** revisar `public/brand/og-image.svg` se copy visual divergir do hero

---

## Changelog deste documento

| Data | Mudança |
|------|---------|
| jun/2026 | Criação — consolida posicionamento C3, trial, checkout off, banners, admin |
