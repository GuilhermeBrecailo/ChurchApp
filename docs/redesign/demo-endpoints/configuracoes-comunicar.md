# Endpoints novos ou alterados — Configurações, Perfil, Comunicar, Relatórios e Oração

Todas as respostas seguem o contrato do `controllerHandler`: `{ "data": …, "status": 200 }`
(erro de regra de negócio: HTTP 200 com `{ "error": "…", "status": 409 }`).

## POST `/api/church/messages/preview` (novo)

Contagem ao vivo do passo "Para quem" do **Novo comunicado** (WhatsApp). Só pastor/admin.
Não envia nada e não cria log.

Body:

```json
{ "audience": "ALL" }
```

`audience`: `ALL` | `MEMBER` | `VISITOR` | `SELECTED`. Com `SELECTED`, mande também
`"recipientIds": ["roster-1", "roster-2"]` (IDs do rol). `SELECTED` sem IDs devolve zeros.

Resposta:

```json
{
  "data": { "recipients": 47, "excludedWithoutConsent": 3, "withoutPhone": 2 },
  "status": 200
}
```

- `recipients`: quem vai receber (membros + visitantes que autorizaram contato).
- `excludedWithoutConsent`: visitantes sem `VisitorFollowUp.consentToContact` (ficam de fora).
- `withoutPhone`: dos `recipients`, quantos não têm telefone (contam como falha no envio).

Demo: calcule a partir do rol fake — status `VISITOR` sem autorização sai da contagem.

## POST `/api/church/messages/send` (comportamento alterado)

Mesmo body de antes (`templateId`, `audience`, `recipientIds?`). Agora **visitantes sem
autorização de contato não recebem** (inclusive escolhidos a dedo em `SELECTED`), e o
`totalCount` do log já vem sem eles. Resposta igual (o `MessageLog` com `status: "PROCESSING"`).

```json
{
  "data": {
    "id": "log-9", "audience": "ALL", "status": "PROCESSING", "totalCount": 47,
    "successCount": 0, "failedCount": 0, "createdAt": "2026-11-11T22:10:00.000Z",
    "finishedAt": null, "ruleId": null, "templateId": "t1"
  },
  "status": 200
}
```

Demo: acrescente o log em `GET /api/church/messages/logs` (aparece em Comunicar › Enviados);
pode marcar `status: "DONE"` e `successCount = totalCount` logo em seguida.

As regras pós-culto e o envio automático/manual de aniversariantes seguem a mesma regra
(sem endpoint novo).

## GET `/api/church/birthdays?range=today|week|month` (campos novos)

Cada pessoa ganhou `status` e `canReceiveMessage` (falso para visitante sem autorização).

```json
{
  "data": [
    { "id": "p1", "name": "Ana Lima", "phone": "41988887777", "birthDate": "1990-11-11T00:00:00.000Z",
      "status": "MEMBER", "canReceiveMessage": true, "turningAge": 36, "daysUntil": 0 },
    { "id": "p2", "name": "João Pedro", "phone": null, "birthDate": "1999-11-11T00:00:00.000Z",
      "status": "VISITOR", "canReceiveMessage": false, "turningAge": 27, "daysUntil": 0 }
  ],
  "status": 200
}
```

`POST /api/church/birthdays/send` só envia para quem tem `canReceiveMessage: true`.

## GET `/api/church/prayer-requests/mine` (novo)

"Meus pedidos" em `/prayer?aba=meus`. Qualquer pessoa com igreja ativa; só os pedidos dela,
os 50 mais recentes. Não expõe quem revisou.

```json
{
  "data": {
    "items": [
      { "id": "pr1", "title": "Saúde da minha mãe", "body": "Ela faz uma cirurgia na quinta.",
        "isAnonymous": false, "isAnswered": false, "status": "PENDING",
        "rejectionReason": null, "reviewedAt": null, "createdAt": "2026-11-10T12:00:00.000Z" },
      { "id": "pr3", "title": "Pedido com nomes", "body": "…", "isAnonymous": false,
        "isAnswered": false, "status": "REJECTED",
        "rejectionReason": "Tinha dados pessoais de outra pessoa.",
        "reviewedAt": "2026-11-07T12:00:00.000Z", "createdAt": "2026-11-06T12:00:00.000Z" }
    ]
  },
  "status": 200
}
```

Demo: `POST /api/church/prayer-requests` deve acrescentar aqui um item `PENDING`; aprovar
(`PATCH …/:id/approve`) muda para `APPROVED`, rejeitar (`PATCH …/:id/reject` com
`{ "reason" }`) muda para `REJECTED` com `rejectionReason`.

## GET `/api/church/whatsapp/status` (campo opcional lido pelo front)

O front aceita `phone` opcional para mostrar "Conectado · (41) 99999-8888". A API ainda não
manda esse campo (só `{ "connected": true }`); no demo pode mandar:

```json
{ "data": { "connected": true, "phone": "5541999998888" }, "status": 200 }
```

## Links de notificação alterados (sem endpoint novo)

- Trial acabando: `url: "/configuracoes/plano"` (era `/plans`).
- Aniversariantes do dia: `url: "/comunicar?aba=automaticos"` (era `/admin/mensagens`).
- Novo pedido de oração: `url: "/prayer?aba=aprovar"` (era `/prayer?tab=pending`, que ainda funciona).

## Checkout do Mercado Pago

`POST /api/church/subscription/checkout` continua igual; o front agora manda
`{ "backUrl": "<origem>/configuracoes/plano" }`. Ao voltar com `?preapproval_id=…` a tela do
plano recarrega `/api/me` e limpa o endereço. Demo: devolva
`{ "checkoutUrl": "/configuracoes/plano?preapproval_id=demo&status=authorized", "mpSubscriptionId": "demo" }`.
