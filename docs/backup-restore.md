# Backup e restore — Neon Postgres

## O que está protegido

O banco de produção roda no **Neon Serverless Postgres** (`DATABASE_URL`). O Neon mantém backups automáticos; em planos pagos, **Point-in-Time Recovery (PITR)** permite restaurar o banco para um instante nos últimos 7–30 dias (conforme o plano).

## Antes do lançamento

1. Confirmar que o projeto Neon de produção está em um **plano com PITR** habilitado.
2. Anotar o **project ID** e o **branch** de produção no console Neon.
3. Guardar `SUBACCOUNT_ENCRYPTION_KEY` e `DATABASE_URL` em um cofre separado da Vercel (perda da chave = CPFs e API keys de subcontas irrecuperáveis).

## Restore de emergência (PITR)

1. Acesse [console.neon.tech](https://console.neon.tech) → projeto de produção.
2. Em **Branches** ou **Restore**, crie um branch a partir de um **timestamp** anterior ao incidente.
3. Copie a connection string do branch restaurado.
4. Valide dados em ambiente isolado (preview ou branch temporário) antes de promover.
5. Para trocar produção: atualize `DATABASE_URL` na Vercel **ou** faça swap do branch no Neon (conforme procedimento do painel).

## Teste recomendado (trimestral)

- Criar branch de restore de teste a partir de um ponto de 1 hora atrás.
- Rodar `npm run migrate` no branch se necessário.
- Executar smoke test: login admin, listar produtos de uma loja, um pedido de teste.
- Apagar o branch de teste após validação.

## O que este runbook não cobre

- **Cloudinary** e **Resend**: usar painéis respectivos para versionamento/export se necessário.
- **Upstash Redis**: dados efêmeros (rate limit); não requer backup.

## Contatos

- Neon support: via console do projeto.
- Responsável interno: definir owner antes do go-live.
