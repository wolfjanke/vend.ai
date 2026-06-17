# vendai.club

Plataforma de vitrine online com IA para lojas de moda no Brasil. Site: https://vendai.club

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
| Pagamentos| Asaas (assinatura dos planos)       |
| E-mail    | Resend                              |
| Deploy    | Vercel                              |

## Planos

| Plano      | Preço/mês | Produtos  | Msgs Vi/mês |
|-----------|-----------|-----------|-------------|
| Grátis    | R$ 0      | 10        | 500         |
| Starter   | R$ 39,90  | 50        | 3.000       |
| Pro       | R$ 59,90  | 200       | 10.000      |
| Loja      | R$ 99,90  | Ilimitado | 30.000      |
| Enterprise| R$ 199,90 | Ilimitado | 60.000      |

Planos pagos incluem excedente de mensagens Vi (ver `lib/plans.ts`). Definição completa em `lib/plans.ts`.

## Setup local

```bash
git clone https://github.com/seu-usuario/vend.ai.git vendai.club
cd vendai.club
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
| Chat Vi            | `gemini-2.5-flash`     | `lib/gemini.ts` → `/api/vi` (prompt em `lib/vi-prompt.ts`) |

Plano **Grátis**: Vi com `gemini-2.5-flash-lite`, sem streaming; ao atingir limite mensal redireciona para WhatsApp.

## Estrutura principal

- `app/[slug]` — vitrine pública
- `app/admin` — painel do lojista
- `app/api/vi` — assistente IA
- `lib/plans.ts` — limites e preços
- `lib/vi-limits.ts` — controle de uso da Vi
