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
node scripts/setup-db.mjs
```

Confirma colunas/tabelas: `password_changed_at`, `email_verified_at`, `email_verification_tokens`, `google_id`.

### Login com Google

13. [ ] Botão Google em `/admin` → conta existente entra no painel
14. [ ] Botão Google em `/cadastro` → nova conta → `/cadastro/loja` → painel
15. [ ] E-mail já cadastrado com senha → Google vincula e entra
16. [ ] Conta só Google → Configurações permite **Definir senha**
17. [ ] Conta só Google → exclusão de conta sem pedir senha (checkbox)

Opcional (e-mails legados com maiúsculas):

```bash
node scripts/migrate-normalize-emails.mjs
```

## Testes manuais

### Cadastro + verificação de e-mail

1. [ ] Criar conta em `/cadastro` → redireciona para `/verificar-email/aguardando`
2. [ ] E-mail de confirmação chega (caixa de entrada ou spam)
3. [ ] Link abre `/verificar-email?token=…` → sucesso → painel acessível
4. [ ] E-mail de boas-vindas após confirmação

### Login

5. [ ] Login com credenciais corretas → `/admin/dashboard`
6. [ ] Conta não verificada → bloqueio com link de reenvio
7. [ ] 10+ tentativas erradas → rate limit (mensagem de aguarde)

### Recuperação de senha

8. [ ] `/esqueci-senha` → e-mail com link
9. [ ] `/redefinir-senha?token=…` → nova senha → mensagem e login
10. [ ] E-mail “Senha alterada” recebido
11. [ ] Sessão antiga invalidada após troca (outra aba deslogada no próximo carregamento)

### Troca de senha (logado)

12. [ ] Configurações → alterar senha → e-mail de notificação

## Logs

- Falhas de envio Resend aparecem como `[forgot-password]`, `[email-verification]`, `[notify-password-changed]`
- Bloqueios de login: `[auth/login] rate limit` com e-mail mascarado
- Rate limit geral: `[rate-limit]` (Upstash ausente, fallback ou IP desconhecido) — ver [rate-limiting.md](./rate-limiting.md)

## Rate limiting (pós-deploy)

1. [ ] Upstash Metrics mostra tráfego após deploy em produção
2. [ ] Tentar 11 logins errados → mensagem de aguarde (já no checklist acima)
3. [ ] Logs Vercel sem `[rate-limit] UPSTASH… ausentes` em produção
