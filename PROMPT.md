# vend.ai — Vi System Prompt

O prompt da assistente Vi é gerado em **`lib/vi-prompt.ts`** (`buildViSystemPrompt`) com o estoque e dados da loja em tempo real.

## Stack de IA

| Uso | Modelo | Módulo / função |
|-----|--------|-----------------|
| Análise de foto no cadastro | `gemini-2.5-flash` | `lib/gemini.ts` → `analyzeProductPhoto()` |
| Chat com o cliente | `gemini-2.5-flash` | `lib/gemini.ts` → `viChatResponse()` |
| Prompt da Vi | — | `lib/vi-prompt.ts` → `buildViSystemPrompt()` |

Plano **Grátis**: chat usa `gemini-2.5-flash-lite` (`lib/vi-limits.ts`), resposta sem streaming; limite 1.000 msgs/mês sem excedente.

## Limites da Vi

- Contadores em `stores.vi_messages_used`, reset mensal automático.
- Limite diário opcional: `stores.vi_daily_limit`.
- Excedente em planos pagos: `stores.vi_overage_messages`.
- Lógica: `lib/vi-limits.ts`.

## Redirecionamento WhatsApp

Quando o limite mensal do plano Grátis é atingido (ou limite diário configurado), a API retorna JSON com `redirectWhatsApp: true` e mensagem amigável — sem mencionar plano ou limite técnico.

## Gatilhos (frontend)

| Gatilho | Comportamento |
|---------|----------------|
| Boas-vindas | Saudação ao abrir o chat |
| Inatividade | Sugestões / recuperação |
| Carrinho abandonado | Engajamento (planos pagos) |

## Escalada humana

A Vi indica WhatsApp quando não souber responder, em trocas/devoluções complexas ou quando o cliente pedir atendimento humano.
