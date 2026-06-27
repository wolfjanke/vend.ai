# Rate limiting — vendai.club

Referência operacional de todos os limites de requisição da API. Valores centralizados em `lib/rate-limit-config.ts`.

## Infraestrutura

| Componente | Descrição |
|------------|-----------|
| **Upstash Redis** | Rate limit distribuído entre instâncias serverless (obrigatório em produção) |
| **Fallback in-memory** | Dev local ou quando Upstash falha — **não** é compartilhado entre lambdas |
| **Algoritmo** | Sliding window via `@upstash/ratelimit` |
| **Prefixo Redis** | `vendai:rl` |

### Variáveis de ambiente

```env
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Sem essas variáveis em produção, o sistema loga **uma vez**:

```
[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN ausentes em produção — fallback in-memory
```

Se Upstash estiver configurado mas indisponível, log throttled (1/min):

```
[rate-limit] Upstash indisponível; fallback in-memory: …
```

### IP desconhecido

Rotas públicas usam `resolveRateLimitIp(req)` em vez de `clientIp(req)`:

- Com `x-forwarded-for` ou `x-real-ip` → IP real
- Sem headers → bucket derivado do User-Agent (`unknown:ua:…`) ou `unknown:anonymous`
- Em produção, warn único: `[rate-limit] IP não identificado …`

---

## Módulos

| Arquivo | Função |
|---------|--------|
| `lib/rate-limit.ts` | `checkRateLimit`, `clientIp`, `resolveRateLimitIp`, `isDistributedRateLimitEnabled` |
| `lib/rate-limit-config.ts` | Constantes (limites e janelas) |
| `lib/rate-limit-helpers.ts` | `checkIpRateLimit`, `checkEmailRateLimit`, `checkStoreRateLimit`, etc. |
| `lib/auth-rate-limit.ts` | Auth / cadastro |
| `lib/billing-rate-limit.ts` | Assinatura, PDV, subconta |
| `lib/store-rate-limit.ts` | Upload, LGPD admin, foto IA |
| `lib/public-rate-limit.ts` | Checkout, vitrine pública |

---

## Rotas protegidas

Resposta padrão **429**: `"Muitas tentativas. Aguarde e tente novamente."` (exceto onde indicado).

### Autenticação

| Rota | Limite | Chave Redis | Resposta especial |
|------|--------|-------------|-------------------|
| `POST /api/auth/login` | 10 IP / 15 min + 5 e-mail / 15 min | `auth:login:ip:…`, `auth:login:email:…` | Log `[auth/login] rate limit` |
| `POST /api/auth/register` | 5 IP/h + 3 e-mail/h | `auth:register:ip:…`, `auth:register:email:…` | 429 |
| `POST /api/auth/complete-signup` | 5 IP/h | `auth:complete-signup:…` | 429 |
| `POST /api/auth/forgot-password` | 3 IP/h + 3 e-mail/h | `auth:forgot:ip:…`, `auth:forgot:email:…` | **Sempre `{ ok: true }`** (anti-enumeração) |
| `POST /api/auth/resend-verification` | 3 IP/h + 3 e-mail/h | `auth:resend-verify:…` | 429 |
| `POST /api/auth/reset-password` | 5 IP/h | `auth:reset:ip:…` | 429 |
| `POST /api/auth/change-password` | 5 usuário / 15 min | `auth:change-pwd:…` | 429 |
| `POST /api/auth/verify-email` | 20 IP/h | `auth:verify-email:ip:…` | 429 |

### Billing / pagamentos (admin autenticado)

| Rota | Limite | Chave |
|------|--------|-------|
| `POST /api/admin/subscription` | 3 loja/h | `billing:subscription:{storeId}` |
| `POST /api/admin/pdv/link` | 20 loja/h | `pdv:link:{storeId}` |
| `POST /api/admin/payments/subaccount` | 3 loja/h | `payments:subaccount:{storeId}` |

### Loja / admin

| Rota | Limite | Chave |
|------|--------|-------|
| `POST /api/upload` | 30 loja/h | `upload:{storeId}` |
| `POST /api/admin/privacidade/excluir-cliente` | 10 loja/h | `lgpd:admin-anon:{storeId}` |
| `POST /api/produtos/analyze` | 10 loja/h (burst) | `photo:analyze:burst:{storeId}` |
| `POST /api/theme/analyze` | 5 loja/h | `theme:analyze:{storeId}` |
| `POST /api/admin/marketing/banner-text` | 10 loja/h | `banner:text:{storeId}` |

### Público / vitrine

| Rota | Limite | Chave | Notas |
|------|--------|-------|-------|
| `GET /api/loja/[slug]` | 60 IP/min | `loja:ip:…` | + `Cache-Control: public, s-maxage=60` |
| `POST /api/checkout/[slug]/create` | 5 IP/min + **30 loja/h** | `checkout:ip:…`, `checkout:store:{slug}` | |
| `POST /api/checkout/payment` (deprecated) | idem | idem | |
| Checkout status (polling) | 60/min por pagamento | `checkout:status:{paymentId}` | Após validação HMAC |
| `POST /api/pedidos` | 10 IP/min + 30 loja/min | `pedidos:ip:…`, `pedidos:store:{storeId}` | WhatsApp |
| `POST /api/privacidade/exclusao` | 3 IP/h | `lgpd:exclusao:…` | Vitrine self-service |
| `POST /api/vi` | 30 IP/min | `vi:ip:…` | + cotas por plano |
| `GET /api/cep/[cep]` | 30 IP/min | `cep:ip:…` | |
| `GET /api/cnpj/[cnpj]` | 30 IP/min | `cnpj:ip:…` | |

### Rotas sem rate limit dedicado (baixa prioridade)

- `GET /api/loja/[slug]/theme`
- `GET /api/upload/status`
- `DELETE /api/admin/subscription`

---

## Monitoramento

### Logs Vercel

Filtrar por:

| Padrão | Significado |
|--------|-------------|
| `[rate-limit]` | Upstash ausente, fallback ou IP desconhecido |
| `[auth/login] rate limit` | Bloqueio de login (e-mail mascarado) |

### Dashboard Upstash

1. [console.upstash.com](https://console.upstash.com) → database do projeto
2. Aba **Metrics**: comandos/min, latência
3. Aba **Data Browser**: chaves com prefixo `vendai:rl` (TTL automático)

Picos de 429 no app + alto volume no Upstash → considerar ajuste de limites em `rate-limit-config.ts`.

### Health check interno

```typescript
import { isDistributedRateLimitEnabled } from '@/lib/rate-limit'
// true quando UPSTASH_* estão configurados
```

---

## Testes

```bash
npm test -- lib/rate-limit lib/auth-rate-limit lib/billing-rate-limit lib/store-rate-limit lib/public-rate-limit lib/rate-limit-helpers
```

Testes usam fallback in-memory (`_resetInMemoryBucketsForTests()` entre casos).

---

## Alterar limites

1. Editar `lib/rate-limit-config.ts`
2. Rodar testes acima
3. Deploy — Upstash aplica novos limites automaticamente (limiters cacheados por `limit:windowMs`)
