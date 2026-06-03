# vend.ai

Sistema de vendas para lojas de moda com IA integrada. Catálogo digital + assistente Vi (Gemini) + pedidos no WhatsApp + checkout Asaas.

**Produção:** [vendai.club](https://vendai.club)

## Stack

| Camada     | Tecnologia                          |
|-----------|-------------------------------------|
| Framework | Next.js 14 (App Router)             |
| Linguagem | TypeScript                          |
| Estilo    | Tailwind CSS (dark glassmorphism)   |
| Banco     | Neon PostgreSQL                     |
| Auth      | NextAuth                            |
| IA        | Google Gemini (modelos por função)  |
| Imagens   | Cloudinary (upload assinado)        |
| Pagamentos| Asaas                               |
| E-mail    | Resend                              |
| Deploy    | Vercel                              |

## Planos

| Plano      | Preço/mês | Produtos  | Msgs Vi/mês |
|-----------|-----------|-----------|-------------|
| Grátis    | R$ 0      | 10        | 1.000       |
| Starter   | R$ 49,90  | 25        | 5.000       |
| Pro       | R$ 99,90  | 200       | 15.000      |
| Loja      | R$ 199,90 | Ilimitado | 40.000      |
| Enterprise| R$ 399,90 | Ilimitado | 60.000      |

Planos pagos incluem excedente de mensagens Vi (ver `lib/plans.ts`). Definição completa em `lib/plans.ts`.

## Setup local

```bash
git clone https://github.com/seu-usuario/vend.ai.git
cd vend.ai
npm install
cp .env.local.example .env.local
```

### Variáveis de ambiente

```env
DATABASE_URL=
GEMINI_API_KEY=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
ASAAS_API_KEY=
ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3
ASAAS_WEBHOOK_TOKEN=
SUBACCOUNT_ENCRYPTION_KEY=
RESEND_API_KEY=
EMAIL_FROM=
```

Opcional: `GEMINI_MODEL` sobrescreve apenas o chat da Vi (padrão `gemini-2.5-flash`). Análise de foto usa `gemini-2.5-flash`; busca de estoque usa `gemini-2.5-flash-lite`.

### Migrations (Neon)

Execute em ordem no SQL Editor do Neon ou via CLI:

```bash
# Arquivos em migrations/
# 001 … schema inicial
# 006_vi_usage.sql — contadores diários Vi
# 007_store_vi_usage.sql — uso mensal na tabela stores + plano enterprise
```

### Rodar

```bash
npm run dev
```

Acesse `http://localhost:3000`.

## Modelos Gemini

| Função              | Modelo                 | Arquivo / rota              |
|--------------------|------------------------|-----------------------------|
| Análise de foto    | `gemini-2.5-flash`     | `lib/gemini.ts` → `/api/produtos/analyze` |
| Chat Vi            | `gemini-2.5-flash`     | `lib/gemini.ts` → `/api/vi` |
| Busca no estoque   | `gemini-2.5-flash-lite`| `lib/gemini.ts` → `searchStock()` |

Plano **Grátis**: Vi com `flash-lite`, sem streaming; ao atingir limite mensal redireciona para WhatsApp.

## Estrutura principal

- `app/[slug]` — vitrine pública
- `app/admin` — painel do lojista
- `app/api/vi` — assistente IA
- `lib/plans.ts` — limites e preços
- `lib/vi-limits.ts` — controle de uso da Vi
