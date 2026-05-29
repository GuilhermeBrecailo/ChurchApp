# Frontend: Estado, Auth e Integracao com API

O front usa composables para autenticar, guardar a sessao e carregar o contexto da igreja do usuario.

## Composable de autenticacao

Arquivo:

- `web/composables/useAuth.ts`

Responsabilidades atuais:

- guardar `access_token` em `useState`;
- guardar dados do usuario em `useState`;
- registrar contas como `PASTOR` ou `MEMBER`;
- fazer login, refresh de sessao e logout;
- decodificar o JWT para iniciar estado local;
- buscar `/api/me` para completar os dados reais do banco.

## Contexto do usuario

Depois de autenticar, o front chama:

- `GET /api/me`

Esse endpoint retorna:

- dados basicos do usuario;
- `role`;
- `crunchId`;
- `church`;
- `hasChurch`;
- `isTitularPastor`.

Esses campos decidem se o usuario pode entrar no app interno ou se deve passar pelo onboarding.

## Onboarding de igreja

Arquivo:

- `web/app/pages/onboarding/church.vue`

Regra:

- pastor sem igreja pode criar uma igreja em `POST /api/church/create-own`;
- membro sem igreja fica bloqueado ate ser vinculado por um pastor/admin;
- usuario com igreja nao permanece no onboarding e volta para `/`.

## Middleware

Arquivo:

- `web/app/middleware/auth.global.ts`

Regras:

- rotas publicas: `/login`, `/register`, `/forgot-password`;
- rotas internas exigem `access_token`;
- se o usuario nao tiver igreja, redireciona para `/onboarding/church`;
- se ja tiver igreja, libera dashboard, escalas, ministerios, usuario e admin.

## Custom fetch

Arquivo:

- `web/app/plugins/customFetch.ts`

O helper `$customFetch` padroniza respostas no formato:

- `data`;
- `error`;
- `status`.
