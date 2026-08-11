# Planos e Billing com Mercado Pago — Design

Data: 2026-08-11
Status: aprovado, pronto para plano de implementação

## Problema

O `Crunch` (igreja) já tem os campos `plan`, `subscriptionStatus`, `trialEndsAt` e `mpSubscriptionId` no schema, e todo pastor que cria uma igreja recebe automaticamente um trial de 90 dias (`userAdapters.ts`). Mas nada mais existe: nenhuma rota lê `plan` para liberar ou bloquear funcionalidade, não há integração de pagamento, não há expiração de trial e não há tela de assinatura. Na prática o trial promete algo que o sistema não cobra e não encerra.

Sem billing funcional não faz sentido divulgar o produto: as igrejas captadas hoje ficariam com acesso integral indefinidamente, e a regra mudaria embaixo delas quando o billing fosse construído.

## Escopo

Entregar o ciclo completo de planos: definição do que cada plano libera, bloqueio efetivo das funcionalidades pagas, assinatura recorrente via Mercado Pago, encerramento automático de trial e tela de assinatura no frontend.

Fora de escopo: modo apresentação (adiado para v2), limites por quantidade de membros ou ministérios (decidido que não haverá), criação de planos pela interface de admin (os três planos são fixos no código).

## Decisões

### Três planos, diferenciados apenas por funcionalidade

`Crunch.plan` passa a aceitar `FREE`, `PREMIUM` e `ILIMITADO`.

Nenhum plano impõe limite de quantidade — nem de membros, nem de ministérios, nem de escalas. A diferença entre planos é inteiramente a lista de funcionalidades liberadas. Limitar ministérios foi descartado porque igrejas pequenas costumam ter vários ministérios por natureza da operação, não por porte; limitar membros foi descartado junto, para manter uma regra só, previsível para o usuário.

`ILIMITADO` libera exatamente as mesmas funcionalidades de `PREMIUM`. Ele não é um tier de venda: é um selo atribuído manualmente pelo admin da plataforma a uma igreja específica, sem cobrança e sem trial.

### Divisão de funcionalidades

Premium (e Ilimitado):

- Personalização da página pública
- Papéis customizados por igreja
- Recursos do ministério (upload de PDF e links)
- Lembrete automático de escala
- Exportar escala como imagem
- Importar música do Cifra Club
- Importar músicas via PDF
- Progresso de leitura do devocional
- Notificações em massa
- Relatórios (confirmações, presença, membros)

Free (todo o resto):

- Cadastro, login, perfil, convite de membro
- Página pública com layout padrão
- Gestão de membros e ministérios
- Tarefas do ministério
- Escalas: criar, editar, confirmar e marcar presença
- Cadastro manual de música e preferência de tom
- Horários de culto
- Devocionais (leitura) e versículo do dia
- Pedidos de oração, incluindo moderação
- Mural, anúncios e upload de imagem em post
- Notificação push individual e inbox

### Configuração em arquivo único

A matriz plano → funcionalidades vive em um módulo `planConfig.ts` no backend, exportando um tipo `PlanFeature` (união de strings) e um mapa `PLAN_FEATURES: Record<Plan, PlanFeature[]>`.

Motivo: a divisão entre pago e gratuito ainda vai mudar conforme o produto encontra seu mercado. Concentrar isso em um arquivo torna a mudança uma edição de uma linha, em vez de uma caçada por condicionais espalhadas pelas rotas.

### Verificação centralizada

`TenantHandler.ts` já é o `preHandler` global que resolve usuário e igreja a cada requisição. Ele passa a resolver também o plano efetivo da igreja e a anexar `hasFeature(feature)` ao `request.churchContext`.

Rotas pagas verificam com uma única chamada; quando a igreja não tem direito, a resposta segue o contrato de erro existente do `controllerHandler` (`DomainError` → HTTP 200 com `{ error, status: 409 }` no corpo), para o frontend tratar do mesmo jeito que já trata os demais erros de domínio.

Plano efetivo não é o valor cru da coluna `plan`: uma igreja em `PREMIUM` com `subscriptionStatus` em `CANCELED`/`EXPIRED`, ou com `trialEndsAt` vencido, é tratada como `FREE`. Essa derivação fica em uma função só, usada tanto pelo gate quanto pela tela de assinatura, para não haver duas verdades sobre o que a igreja pode fazer.

### Atribuição do plano Ilimitado

Nova rota em `AdminRoutes.ts`, restrita a `SUPER_ADMIN`/`ADMIN`, que define o plano de uma igreja. Escolhida em vez de edição direta no banco porque deixa rastro, dispensa acesso ao Postgres de produção e evita erro manual em uma operação que concede acesso pago.

### Mercado Pago

Assinatura recorrente via API de assinaturas (preapproval) do Mercado Pago. O `mpSubscriptionId` já existente no `Crunch` guarda o identificador da assinatura.

O MCP oficial do Mercado Pago (`https://mcp.mercadopago.com/mcp`) expõe `search-documentation`, `save_webhook`, `notifications_history_diagnostics`, `create_test_user`, `add_money_test_user`, `get_credentials`, `create_application` e `application_list`. Não há ferramenta para criar assinatura ou checkout: o MCP serve para consultar documentação, provisionar credenciais e ambiente de teste e configurar/diagnosticar o webhook durante o desenvolvimento. A chamada de cobrança em si é REST/SDK dentro do `api/src`, em runtime, sem MCP envolvido.

Endpoints e payloads confirmados na documentação oficial (não assumidos de memória):

- **Criar assinatura**: `POST https://api.mercadopago.com/preapproval`. Sem plano associado, `reason`, `external_reference` e `payer_email` são obrigatórios; `auto_recurring` (`frequency`, `frequency_type`, `transaction_amount`, `currency_id`, `start_date`, `end_date`) define a recorrência; `card_token_id` e `back_url` são condicionais. Resposta inclui `id`, `status`, `payer_id`, `next_payment_date`, `date_created` — `id` é o que vira `mpSubscriptionId`.
- **Status confirmados na documentação**: `pending` e `authorized`. Os demais valores do enum (esperado algo como `paused`/`cancelled`) não apareceram no fetch feito e precisam ser confirmados contra a resposta real de uma assinatura de teste antes de codificar o `switch` no webhook — não assumir a lista completa de memória.
- **Webhook**: dois topics relevantes — `subscription_preapproval` (criação/atualização da assinatura em si) e `subscription_authorized_payment` (cada cobrança recorrente). Payload da notificação: `{ id, live_mode, type, date_created, user_id, api_version, action, data: { id } }` — o `data.id` é o identificador do recurso, não o conteúdo; o handler precisa buscar o estado atual via `GET /preapproval/{id}` (ou `/preapproval/search`) em vez de confiar em qualquer campo de status que venha dentro da notificação.
- **Validação de assinatura**: o Mercado Pago manda a notificação assinada no header `x-signature` (formato `ts=<timestamp>,v1=<hmac>`) e `x-request-id`; validar o HMAC é o que impede alguém de forjar uma notificação de pagamento aprovado direto pro endpoint do webhook.

Fonte: documentação oficial do Mercado Pago (developers.mercadopago.com.br), consultada em 2026-08-11. O MCP oficial (`https://mcp.mercadopago.com/mcp`, ferramenta `search-documentation`) é o caminho preferido pra reconfirmar isso no momento exato da implementação, caso a API tenha mudado entre a escrita deste spec e o código.

Fluxo:

1. Pastor pede upgrade na tela de assinatura.
2. Backend cria a assinatura no Mercado Pago, grava `mpSubscriptionId` e devolve a URL de checkout.
3. Pastor paga no ambiente do Mercado Pago.
4. Webhook chega ao backend, que localiza a igreja pelo `mpSubscriptionId` e atualiza `plan`/`subscriptionStatus`.

O webhook é a fonte de verdade do estado da assinatura; a resposta do checkout não é. Isso evita liberar acesso com base em um retorno de navegador que o usuário pode forjar ou abandonar no meio.

Requisitos do webhook: rota pública (fora do `TenantHandler`), validação de assinatura da requisição, e idempotência — o Mercado Pago reenvia notificações, então processar duas vezes o mesmo evento não pode duplicar efeito.

### Expiração de trial

Verificação diária que rebaixa igrejas com `trialEndsAt` vencido e sem assinatura ativa para `FREE`/`EXPIRED`.

O gate já trata trial vencido como `FREE` em tempo de requisição, então o job não é o que protege o acesso — ele existe para manter o dado coerente para relatórios e para a tela de assinatura. Igrejas em `ILIMITADO` são ignoradas pelo job.

### Tela de assinatura

Página no `web/app` mostrando plano atual, dias restantes de trial quando aplicável, comparação entre Free e Premium e botão de upgrade que abre o checkout.

Inclui link visível de cancelamento (exigência prática de relação de consumo em assinatura recorrente no Brasil) e link para a política de privacidade, dado que o produto armazena dados pessoais de membros de igreja.

## Componentes

| Componente | Responsabilidade | Depende de |
|---|---|---|
| `planConfig.ts` | Matriz plano → funcionalidades; tipo `PlanFeature` | — |
| Resolução de plano efetivo | Derivar plano real a partir de `plan`, `subscriptionStatus`, `trialEndsAt` | `planConfig.ts` |
| Gate no `TenantHandler` | Anexar `hasFeature` ao `churchContext` | resolução de plano efetivo |
| Rotas pagas | Chamar `hasFeature` e recusar via `DomainError` | gate |
| Rota admin de plano | Atribuir plano manualmente (Ilimitado) | — |
| Serviço Mercado Pago | Criar assinatura, devolver URL de checkout | credenciais MP |
| Webhook | Atualizar `subscriptionStatus` a partir das notificações | serviço MP |
| Job de trial | Rebaixar trials vencidos | resolução de plano efetivo |
| Tela de assinatura | Exibir estado e disparar upgrade | serviço MP, gate |

## Divisão de trabalho

Claude: migração do plano no schema, `planConfig.ts`, resolução de plano efetivo, gate no `TenantHandler`, aplicação do gate nas rotas pagas, rota de admin.

Codex: serviço de assinatura do Mercado Pago, webhook, job de expiração de trial.

A fronteira entre os dois é estreita de propósito — o lado do Mercado Pago só precisa escrever `plan`, `subscriptionStatus` e `mpSubscriptionId` no `Crunch`; toda a decisão sobre o que a igreja pode fazer fica do lado do gate. Os dois blocos podem avançar em paralelo assim que a migração do schema estiver aplicada.

## Testes

- `planConfig.ts`: cada plano libera exatamente a lista esperada.
- Resolução de plano efetivo: premium com trial vencido, com assinatura cancelada e com assinatura ativa; ilimitado ignora status e trial.
- Gate: rota paga recusa igreja Free e aceita igreja Premium.
- Webhook: notificação de pagamento aprovado ativa a assinatura; notificação repetida não duplica efeito; notificação com assinatura desconhecida não derruba a rota.
- Job de trial: rebaixa trial vencido, preserva assinatura ativa, ignora Ilimitado.

Os testes do backend seguem o Jest já configurado em `api/tests`.

## Riscos

Credenciais do Mercado Pago em produção precisam existir antes do webhook ser testável de ponta a ponta; o ambiente de teste (`create_test_user` via MCP) cobre o desenvolvimento até lá.

O contrato de erro não convencional do `controllerHandler` (erro de domínio em HTTP 200) já é conhecido no projeto, mas vale atenção ao consumir o gate no frontend: a tela precisa ler o campo `status` do corpo, não o código HTTP.
