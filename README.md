# vend.ai

Sistema de vendas para lojas de roupa com IA integrada. Catálogo digital + assistente Vi (Claude) + pedidos direto no WhatsApp.

## Stack

| Camada       | Tecnologia                        |
|-------------|----------------------------------|
| Framework   | Next.js 14 (App Router)          |
| Linguagem   | TypeScript                       |
| Estilo      | Tailwind CSS (dark glassmorphism) |
| Banco       | Supabase (PostgreSQL + Auth + Storage) |
| IA          | Anthropic Claude (`claude-sonnet-4-6`) |
| Deploy      | Vercel                           |

---

## Funcionalidades

### 🛍️ Loja Pública (`/[slug]`)
- Catálogo com grid de produtos filtráveis por categoria, tamanho e cor
- Busca por texto (nome, descrição, categoria)
- Carrinho lateral (drawer)
- Checkout: cliente informa nome + WhatsApp → pedido salvo no Supabase + mensagem formatada abre no wa.me
- Assistente Vi (chat flutuante com IA real via Claude)
- Dialog de recuperação de lead por inatividade

### ✦ Vi — Assistente IA
- Chat em tempo real com streaming (Claude `claude-sonnet-4-6`)
- Conhece todo o estoque da loja em tempo real
- Sugestões por estilo, ocasião, cor, tamanho
- Escala para WhatsApp quando não sabe responder
- Gatilhos automáticos de engajamento

### 📊 Painel Admin (`/admin`)
- Autenticação segura via Supabase Auth
- Dashboard com métricas do dia (novos pedidos, faturamento)
- Gestão de pedidos com ciclo de status (NOVO → CONFIRMADO → EM_ENTREGA → ENTREGUE)
- CRUD de produtos

### 📸 Cadastro de Produto com IA
- Upload múltiplo de fotos da galeria
- IA analisa as fotos e agrupa por variação de cor automaticamente
- Sugere nome, descrição e categoria (tudo editável)
- Controle de estoque por tamanho × cor
- Badge "✦ Sugerido pela IA" desaparece ao editar

### ✨ Onboarding (`/cadastro`)
- 3 passos: conta → loja → sucesso
- Slug gerado automaticamente pelo nome da loja
- Preview do link em tempo real

---

## Setup

### 1. Clone e instale

```bash
git clone https://github.com/seu-usuario/vend.ai.git
cd vend.ai
npm install
```

### 2. Configure o banco de dados (Supabase)

1. Crie um projeto em [supabase.com](https://supabase.com)
2. No SQL Editor, execute o conteúdo de [`supabase/schema.sql`](./supabase/schema.sql)
3. Em Storage, crie um bucket público chamado `product-photos`

### 3. Configure as variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Edite `.env.local` com seus valores:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Rode em desenvolvimento

```bash
npm run dev
```

Acesse: **http://localhost:3000**

### 5. Deploy na Vercel

```bash
npm i -g vercel
vercel
```

Adicione as variáveis de ambiente no painel da Vercel.

---

## Estrutura do Projeto

```
vendai/
├── app/
│   ├── page.tsx                    → Landing page
│   ├── cadastro/page.tsx           → Onboarding (3 passos)
│   ├── [slug]/
│   │   ├── page.tsx                → Server Component (fetch Supabase)
│   │   └── StoreClient.tsx         → Client Component (carrinho, Vi, etc.)
│   ├── admin/
│   │   ├── page.tsx                → Login
│   │   ├── layout.tsx              → Layout admin + nav
│   │   ├── actions.ts              → Server Actions (updateOrderStatus, etc.)
│   │   ├── dashboard/page.tsx      → Métricas e pedidos recentes
│   │   ├── pedidos/page.tsx        → Gestão de pedidos
│   │   ├── produtos/page.tsx       → Listagem de produtos
│   │   ├── produtos/novo/page.tsx  → Cadastro com IA
│   │   └── configuracoes/page.tsx  → Config da loja
│   └── api/
│       ├── vi/route.ts             → Chat Vi (streaming Claude)
│       ├── pedidos/route.ts        → Criar pedido no Supabase
│       ├── produtos/analyze/route.ts → Análise de fotos com Claude
│       └── auth/logout/route.ts    → Logout
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   └── Input.tsx
│   ├── loja/
│   │   ├── Catalogo.tsx            → Grid + busca + filtros
│   │   ├── ProdutoCard.tsx         → Card individual
│   │   ├── Carrinho.tsx            → Drawer do carrinho
│   │   └── ViChat.tsx              → Widget de chat
│   └── admin/
│       ├── MetricCard.tsx          → Card de métrica
│       ├── PedidoCard.tsx          → Card de pedido com ações
│       └── ProdutoForm.tsx         → Formulário de produto com IA
├── lib/
│   ├── supabase.ts                 → Clientes Supabase (server + browser)
│   ├── anthropic.ts                → Cliente Claude + prompts
│   └── whatsapp.ts                 → Formatação de mensagem + wa.me URL
├── types/index.ts                  → Tipos TypeScript globais
├── middleware.ts                   → Auth guard para /admin
├── supabase/schema.sql             → Schema SQL completo
├── .env.local.example              → Template de variáveis
└── PROMPT.md                       → Documentação do prompt da Vi
```

---

## Design System

| Token        | Valor       | Uso                          |
|-------------|------------|------------------------------|
| `--bg`      | `#08080F`  | Background principal         |
| `--surface` | `#11111C`  | Cards e superfícies          |
| `--primary` | `#7B6EFF`  | Roxo — ações principais      |
| `--accent`  | `#00E5A0`  | Verde — preços, sucesso      |
| `--warm`    | `#FF6B6B`  | Vermelho — alertas, estoque  |
| `--muted`   | `#7777AA`  | Texto secundário             |

Fontes: **Syne** (display/headings) + **DM Sans** (body)

---

## Banco de Dados

### `stores`
| Coluna          | Tipo      | Descrição                  |
|----------------|----------|---------------------------|
| `id`           | uuid      | PK                         |
| `user_id`      | uuid      | FK → auth.users            |
| `slug`         | text      | URL única da loja          |
| `name`         | text      | Nome exibido               |
| `logo_url`     | text?     | URL no Storage             |
| `whatsapp`     | text      | Número sem formatação      |
| `settings_json`| jsonb     | Config da loja             |

### `products`
| Coluna           | Tipo      | Descrição                          |
|-----------------|----------|------------------------------------|
| `id`            | uuid      | PK                                  |
| `store_id`      | uuid      | FK → stores                         |
| `name`          | text      | Nome do produto                     |
| `description`   | text      | Descrição                           |
| `category`      | text      | vestido\|blusa\|calca\|conjunto\|saia\|outro |
| `price`         | numeric   | Preço                               |
| `promo_price`   | numeric?  | Preço promocional                   |
| `variants_json` | jsonb     | Array de variantes (cor + estoque)  |
| `active`        | boolean   | Visível na loja                     |

### `orders`
| Coluna              | Tipo         | Descrição           |
|--------------------|-------------|---------------------|
| `id`               | uuid         | PK                  |
| `store_id`         | uuid         | FK → stores         |
| `order_number`     | text         | Ex: `0042`          |
| `customer_name`    | text         | Nome do cliente     |
| `customer_whatsapp`| text         | Número do cliente   |
| `items_json`       | jsonb        | Array de itens      |
| `total`            | numeric      | Total em R$         |
| `notes`            | text         | Observações         |
| `status`           | order_status | NOVO → … → ENTREGUE |

---

## Scripts

```bash
npm run dev    # Servidor de desenvolvimento
npm run build  # Build de produção
npm run start  # Servidor de produção
npm run lint   # Verificar código
```

---

Feito com ✦ para lojistas que querem vender mais.
