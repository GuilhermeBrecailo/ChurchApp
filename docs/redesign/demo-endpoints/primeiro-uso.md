# Demo endpoints: primeiro uso / entrada

Novos ou alterados pela área "primeiro uso". Todas as respostas seguem o
contrato do `controllerHandler`: sucesso `{ data, status: 200 }`; erro de
domínio HTTP 200 com `{ error, status: 409 }`.

## GET /api/me (alterado)

`pendingChurches` agora traz `slug` (a tela "Aguardando aprovação" usa para
"Ver a página da igreja").

```json
{
  "data": {
    "id": "maria-1",
    "name": "Maria Souza",
    "email": "maria@exemplo.com",
    "role": "MEMBER",
    "hasChurch": false,
    "memberships": [],
    "mustChangePassword": false,
    "pendingChurches": [
      { "id": "church-1", "name": "Igreja Batista Central", "slug": "ibc" }
    ]
  },
  "status": 200
}
```

O front decide para onde mandar a pessoa a partir de `/api/me`:
`mustChangePassword: true` → `/definir-senha`; `role: "PASTOR"` sem igreja →
`/onboarding/church`; `pendingChurches.length > 0` → `/onboarding/aguardando`;
sem igreja e sem pedido → `/join`.

## GET /public/church/invite/:code (alterado)

Sem login. Agora também devolve `slug`.

```json
{ "data": { "name": "Igreja Batista Central", "logo": null, "slug": "ibc" }, "status": 200 }
```

Código desconhecido: `{ "error": "Código de convite inválido ou expirado", "status": 409 }`.

## POST /public/church/invite/:code/register (alterado)

Sem login. Body: `{ "name", "email", "phone", "password" }`.

Sucesso (cria a conta e um vínculo **pendente**; o front já faz login em
seguida com `POST /public/auth/login`):

```json
{ "data": { "success": true, "churchName": "Igreja Batista Central", "churchSlug": "ibc" }, "status": 200 }
```

E-mail que já tem conta (novo `code`):

```json
{
  "error": "Você já tem conta com esse e-mail. Entre com sua senha para continuar o pedido.",
  "code": "ACCOUNT_EXISTS",
  "status": 409
}
```

Estado no demo: adiciona o usuário com `pendingChurches: [igreja]`,
`hasChurch: false`; incrementa a lista de `GET /api/church/members/pending` da
igreja e cria a notificação "Maria pediu para participar" para o pastor.

## POST /api/church/join (alterado)

Logado. Body: `{ "inviteCode": "AB12CD34" }`. **Sempre cria vínculo pendente**
(antes, quem estava logado entrava direto).

```json
{
  "data": {
    "success": true,
    "churchId": "church-1",
    "churchName": "Igreja Batista Central",
    "churchSlug": "ibc",
    "membershipId": "membership-9",
    "alreadyMember": false,
    "pending": true
  },
  "status": 200
}
```

Já tinha vínculo: `alreadyMember: true` e `pending` reflete se ele ainda está
pendente (`false` = já é membro ativo). Estado no demo: igual ao register
(pedido pendente + notificação para quem aprova); `GET /api/me` passa a trazer
a igreja em `pendingChurches`.

## POST /api/church/members/pending/:id/approve (efeito novo)

Resposta igual (`{ "data": { "success": true }, "status": 200 }`). Novo efeito:
cria para a pessoa aprovada a notificação

```json
{
  "title": "Você foi aprovado!",
  "body": "Agora você faz parte da Igreja Batista Central. Toque para entrar.",
  "url": "/",
  "type": "membership_approved"
}
```

e, no `/api/me` dela, a igreja sai de `pendingChurches` e entra em
`memberships` (`hasChurch: true`).

## Notificação "pediu para participar" (efeito novo de join/register)

Vai para os membros ativos com papel PASTOR/ADMIN, `canManageMembers` ou cargo
de igreja com `MEMBER_CREATE`:

```json
{
  "title": "Maria pediu para participar",
  "body": "Maria Souza quer entrar na igreja. Toque para aprovar ou recusar.",
  "url": "/pessoas?filtro=pendentes",
  "type": "membership_request"
}
```

## Endpoints já existentes usados pelas telas novas (sem mudança)

- `POST /api/church/create-own` com `{ name, city, state, setupMode: "later", initialDepartments: [] }` (criar igreja).
- `PATCH /api/me/password` com `{ password, passwordConfirmation }` → zera `mustChangePassword` (tela `/definir-senha`).
- Checklist do Início: `GET /api/church/service-times`, `POST /api/church/service-times`
  (`{ label, weekday, time, isActive: true }`), `GET /api/church/departments`,
  `GET /api/church/members`, `GET /api/church/members/pending`,
  `GET /api/church/schedules`, `GET /api/church/invite-code`.
