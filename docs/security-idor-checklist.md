# Checklist IDOR — loja A vs loja B

Procedimento manual antes do lançamento. Autenticado como **loja B**, usar IDs de recursos da **loja A**. Resultado esperado: **403** ou **404**, nunca **200** com dados alheios.

| Rota | Método | Filtro `store_id` / sessão | Esperado (B → recurso A) |
|------|--------|----------------------------|---------------------------|
| `/api/pedidos` | POST | tenant resolvido por `storeSlug` no body (não confiar em UUID do cliente) | N/A (público) |
| `/api/produtos` | POST | `session.storeId` no INSERT | N/A (cria em B) |
| `/api/produtos/[id]` | GET/PUT/DELETE | `AND store_id = session.storeId` | 404 |
| `/api/pedidos/[id]` | PUT/PATCH | `AND store_id = session.storeId` | 403/404 |
| `/api/admin/store` | GET/PATCH | `session.storeId` | Só dados de B |
| `/api/admin/pedidos` | GET | `store_id` na query | Sem pedidos de A |
| `/api/admin/pdv` | GET/POST | `session.storeId` + plano `loja` | 403 se plano ≠ loja |
| `/api/admin/pdv/link` | POST | `session.storeId` + plano `loja` | 403 se plano ≠ loja |
| `/api/admin/dashboard` | GET | `session.storeId` | Sem métricas de A |
| `/api/admin/financeiro` | GET | `session.storeId` | Sem dados de A |
| `/api/admin/payments/subaccount` | POST | `session.storeId` | N/A |
| `/api/upload` | POST | pasta `vendai/{storeId}/` | Não grava em A |
| `/api/admin/privacidade/excluir-cliente` | POST | `store_id` no UPDATE | Não afeta pedidos de A |
| Server actions `updateOrderStatus` | POST | `getSession()` + `WHERE store_id` | Erro se pedido de A |
| Server actions `toggleProductActive` | POST | `getSession()` + `WHERE store_id` | Erro se produto de A |
| Server actions `deleteProduct` | POST | `getSession()` + `WHERE store_id` | Erro se produto de A |
| Server actions categorias | POST | `getSession()` + `store_id` | OK (já escopado) |

## Registro de teste

| Data | Testador | Rotas com falha | Notas |
|------|----------|-----------------|-------|
| 2026-06-04 | Revisão estática (pré-lançamento) | — | `app/admin/actions.ts`: `updateOrderStatus`, `toggleProductActive` e `deleteProduct` passaram a exigir sessão e filtrar por `store_id`. APIs PDV passaram a exigir plano `loja`. **Recomendado:** repetir teste manual com duas lojas reais antes do go-live. |
