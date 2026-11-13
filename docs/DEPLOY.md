# Deploy

Push na `main` publica na VPS Hostinger (`187.77.238.124`). Nao ha passo manual.

## Como funciona

1. `git push` na `main` (normalmente via PR; o `ci.yml` roda no PR).
2. O workflow `.github/workflows/deploy.yml` (GitHub Actions, runner do proprio
   GitHub) conecta por SSH na VPS e executa `platform-autodeploy --once --service churchapp`.
3. Na VPS, o `platform-autodeploy` faz clone da `main`, `docker compose build`
   de `api` e `web`, recria os containers, confere `https://churchapp.site/` e
   `https://api.churchapp.site/status`. Se falhar, volta sozinho para a versao
   anterior (rollback) e o workflow fica vermelho.
4. Mesmo sem o workflow, o timer `platform-autodeploy.timer` confere a `main` a
   cada 5 min e faz o mesmo deploy.

Projeto compose na VPS: `churchapp-staging` (nome legado; e o que serve
`churchapp.site`). Config: `/etc/platform/autodeploy.json`. Log:
`/var/log/platform-autodeploy/autodeploy.log`. Estado:
`/var/lib/platform-autodeploy/churchapp.json`.

## Segredo do GitHub

`VPS_SSH_KEY`: chave privada ED25519 dedicada ao deploy. No `authorized_keys` da
VPS ela fica restrita a um unico comando:

```
restrict,command="/usr/local/bin/platform-autodeploy --once --service churchapp; cat /var/lib/platform-autodeploy/churchapp.json" ssh-ed25519 AAAA... github-actions-churchapp-deploy
```

Para trocar a chave: gerar outra, trocar a linha no `authorized_keys` e
atualizar o segredo (`gh secret set VPS_SSH_KEY`).

## Se o deploy falhar

- Ver o log do run no GitHub e `journalctl`/o log acima na VPS.
- Rollback ja e automatico; o servidor continua na versao anterior.
- Refazer: corrigir e dar push, ou rodar o workflow manualmente (`workflow_dispatch`).
