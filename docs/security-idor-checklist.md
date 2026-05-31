# Checklist IDOR — loja A vs loja B

Procedimento manual antes do lançamento. Autenticado como **loja B**, usar IDs de recursos da **loja A**. Resultado esperado: **403** ou **404**, nunca **200** com dados alheios.

| Rota | Método | Filtro `store_id` / sessão | Esperado (B → recurso A) |
|------|--------|----------------------------|---------------------------|
| `/api/produtos` | POST | `session.storeId` no INSERT | N/A (cria em B) |
| `/api/produtos/[id]` | GET/PUT/DELETE | `AND store_id = session.storeId` | 404 |
| `/api/pedidos/[id]` | PUT/PATCH | `AND store_id = session.storeId` | 403/404 |
| `/api/admin/store` | GET/PATCH | `session.storeId` | Só dados de B |
| `/api/admin/pedidos` | GET | `store_id` na query | Sem pedidos de A |
| `/api/admin/pdv` | POST | `session.storeId` | N/A |
| `/api/admin/pdv/link` | POST | `session.storeId` | N/A |
| `/api/admin/dashboard` | GET | `session.storeId` | Sem métricas de A |
| `/api/admin/financeiro` | GET | `session.storeId` | Sem dados de A |
| `/api/admin/payments/subaccount` | POST | `session.storeId` | N/A |
| `/api/upload` | POST | pasta `vendai/{storeId}/` | Não grava em A |
| `/api/admin/privacidade/excluir-cliente` | POST | `store_id` no UPDATE | Não afeta pedidos de A |
| Server actions `app/admin/actions.ts` | * | Verificar `storeId` em cada action | 403 |

## Registro de teste

| Data | Testador | Rotas com falha | Notas |
|------|----------|-----------------|-------|
|      |          |                 |       |
