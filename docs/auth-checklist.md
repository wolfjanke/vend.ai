# Checklist de autenticação (deploy e operação)

Use após mudanças em auth ou em cada release que toque login/cadastro.

## Variáveis de ambiente (produção)

- [ ] `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (login com Google)
- [ ] `NEXTAUTH_SECRET` (ou `AUTH_SECRET`)
- [ ] `NEXTAUTH_URL` = URL pública (https)
- [ ] `NEXT_PUBLIC_APP_URL` = mesma base pública
- [ ] `RESEND_API_KEY` + `EMAIL_FROM` (domínio verificado no Resend)
- [ ] `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (**obrigatório em produção** — sem isso o rate limit não é distribuído no serverless). Ver [rate-limiting.md](./rate-limiting.md).
- [ ] `SUPERADMIN_EMAILS` (lista de e-mails do painel superadmin)

## Banco de dados

```bash
npm run migrate
# ou ambiente novo:
node scripts/setup-db.mjs
```

Confirma colunas/tabelas: `password_changed_at`, `email_verified_at`, `email_verification_tokens`, `google_id`, `session_version`, `last_login_ip`.

Migrations de auth recentes: **029** (`session_version`), **030** (`last_login_ip`).

### Login com Google

13. [ ] Botão Google em `/admin` → conta existente entra no painel
14. [ ] Botão Google em `/cadastro` → nova conta → `/cadastro/loja` → painel
15. [ ] E-mail já cadastrado com senha → Google vincula e entra
16. [ ] Conta só Google → Configurações permite **Definir senha**
17. [ ] Conta só Google → exclusão de conta sem pedir senha (checkbox)
18. [ ] Erros OAuth exibem mensagem genérica (sem revelar conflito de conta)

Opcional (e-mails legados com maiúsculas):

```bash
node scripts/migrate-normalize-emails.mjs
```

## Testes manuais

### Cadastro + verificação de e-mail

1. [ ] Criar conta em `/cadastro` → redireciona para `/verificar-email/aguardando`
2. [ ] E-mail de confirmação chega (caixa de entrada ou spam)
3. [ ] Link abre `/verificar-email#token=…` → sucesso → painel acessível (links legados `?token=` ainda funcionam)
4. [ ] E-mail de boas-vindas após confirmação
5. [ ] E-mail já cadastrado → mesma resposta genérica (sem revelar existência)

### Login

6. [ ] Login com credenciais corretas → `/admin/dashboard`
7. [ ] Conta não verificada → mensagem genérica “E-mail ou senha inválidos” + link fixo “Não recebeu o e-mail?”
8. [ ] 10+ tentativas erradas → rate limit (mensagem de aguarde)
9. [ ] Login de IP diferente → e-mail de alerta (a partir do 2º IP conhecido)

### Recuperação de senha

10. [ ] `/esqueci-senha` → e-mail com link
11. [ ] `/redefinir-senha#token=…` → nova senha → mensagem e login
12. [ ] E-mail “Senha alterada” recebido
13. [ ] Sessão antiga invalidada após troca (outra aba deslogada no próximo carregamento)
14. [ ] Senha vazada (HIBP) rejeitada; em produção, API HIBP indisponível bloqueia cadastro/troca

### Troca de senha (logado)

15. [ ] Configurações → alterar senha → e-mail de notificação → redirect para login
16. [ ] Política: mínimo 8 caracteres + 2 de 4 categorias (maiúscula, minúscula, número, símbolo)

### Sessão e logout

17. [ ] TTL da sessão: **3 dias**
18. [ ] Logout invalida JWT no servidor (`session_version` incrementada)
19. [ ] Superadmin login negado chama `/api/auth/revoke-session` (não deixa sessão órfã)
20. [ ] **Pós-deploy auth:** rodar `npm run auth:revoke-all-sessions -- --yes` uma vez — invalida também JWTs legados sem claim `sessionVer` (tratados como v1)

## CSP (produção)

21. [ ] Resposta HTML inclui header `Content-Security-Policy` com `nonce-` (sem `unsafe-eval`)
22. [ ] Dev local continua com `unsafe-inline` / `unsafe-eval` (HMR)
23. [ ] Checkout cartão Asaas carrega (`script-src` inclui asaas.com)
24. [ ] Vitrine com tema customizado renderiza (CSS inline com nonce)

## Logs

- Falhas de envio Resend aparecem como `[forgot-password]`, `[email-verification]`, `[notify-password-changed]`, `[login-alert]`
- Bloqueios de login: `[auth/login] rate limit` com e-mail mascarado
- Rate limit geral: `[rate-limit]` (Upstash ausente, fallback ou IP desconhecido) — ver [rate-limiting.md](./rate-limiting.md)

## Rate limiting (pós-deploy)

1. [ ] Upstash Metrics mostra tráfego após deploy em produção
2. [ ] Tentar 11 logins errados → mensagem de aguarde (já no checklist acima)
3. [ ] Logs Vercel sem `[rate-limit] UPSTASH… ausentes` em produção
4. [ ] Data Browser Upstash: chaves com prefixo `vendai:rl:*` após tráfego real
