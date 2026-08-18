## Why

Não existe uma página pública da igreja para compartilhar com visitantes ou novos membros. Toda a informação já está no model `Crunch` — falta apenas uma rota pública que a exiba sem exigir login.

## What Changes

- Nova página pública `/church` (sem autenticação) exibindo logo, nome, endereço, horários dos cultos e código de convite.
- Endpoint público `GET /api/public/church/:inviteCode` retornando dados básicos da igreja pelo código de convite.
- Botão "Entrar na igreja" na página que leva ao fluxo de cadastro/join com o código pré-preenchido.

## Capabilities

### New Capabilities

- `church-profile-page`: Página pública de perfil da igreja com informações básicas e link de entrada para novos membros.

### Modified Capabilities

<!-- Nenhuma spec existente com mudança de requisitos -->

## Impact

- **Backend**: Novo endpoint público `GET /api/public/church/:inviteCode` sem guard de autenticação; novo adapter/route `PublicRoutes.ts`.
- **Frontend (web)**: Página `pages/church/[inviteCode].vue` acessível sem login; middleware de autenticação deve permitir acesso.
- **Banco de dados**: Sem migration — usa dados existentes de `Crunch`.
