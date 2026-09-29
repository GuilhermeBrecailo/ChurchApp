# Plan: Integração ChurchApp com Holyrics

> **For agent execution:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to execute this plan task-by-task.

## Goal

Permitir que uma igreja conecte o Holyrics e, a partir dos detalhes de uma escala, adicione as músicas já cadastradas no Holyrics à playlist atualmente selecionada, preservando a ordem da escala e mostrando claramente músicas encontradas e não encontradas.

O MVP será opt-in, manual e somente de ida: não altera a escala do ChurchApp, não cria letras novas no Holyrics e não tenta controlar a apresentação do telão.

## Architecture

- A conexão será armazenada por igreja em `Crunch` com dois campos opcionais: `holyricsApiKey` e `holyricsToken`. O backend nunca devolverá os valores secretos no status.
- O cliente externo ficará em `api/src/infrastructure/holyrics/HolyricsServiceClient.ts`, usando os endpoints oficiais `https://api.holyrics.com.br/request/{action}` com os headers `api_key` e `token`.
- `api/src/interfaces/adapters/holyricsAdapters.ts` cuidará de autenticação do usuário, escopo da igreja, permissões e leitura das escalas; `HolyricsRoutes.ts` exporá status, conectar, desconectar e sincronizar uma escala.
- A sincronização chamará `SearchLyrics` por música, escolherá somente um resultado exato/seguro por título e artista, reportará ambiguidade como não encontrada e fará um único `AddLyricsToPlaylist` com os IDs encontrados na ordem da escala.
- Como a API oficial só recebe `event_id` para alterar um culto específico e isso exige um ID de evento do próprio Holyrics/Plan, o primeiro MVP trabalhará explicitamente sobre a playlist que estiver selecionada no Holyrics. A interface informará isso para evitar a falsa promessa de uma playlist nomeada.
- A configuração ficará em `Administração → Configurações → Integrações → Holyrics`; a ação ficará na seção `Louvor` dos detalhes da escala, junto de `Tocar sequência`.

## Task 1: Backend de conexão e cliente Holyrics

**Files:** `api/src/infrastructure/database/prisma/schema.prisma`, nova migration Prisma, `api/src/infrastructure/holyrics/HolyricsServiceClient.ts`, `api/src/interfaces/adapters/holyricsAdapters.ts`, `api/src/interfaces/routes/HolyricsRoutes.ts`, `api/server.ts`.

- Escrever primeiro testes para cliente/adaptador cobrindo: status sem segredo, conexão válida salva apenas depois da validação, conexão inválida não persiste, desconexão limpa os dois campos e escopo por `crunchId`.
- Rodar os testes novos para confirmar a falha inicial.
- Adicionar os campos opcionais e migration.
- Implementar o cliente com timeout, envelope de resposta oficial, mensagens de erro sanitizadas e distinção entre token/API key inválidos, Holyrics offline e permissão insuficiente.
- Validar conexão com `GetTokenInfo`/`CheckPermissions` para `SearchLyrics` e `AddLyricsToPlaylist`; salvar somente quando a validação passar.
- Criar os endpoints:
  - `GET /api/church/holyrics/status`
  - `POST /api/church/holyrics/connect`
  - `POST /api/church/holyrics/disconnect`
  - `POST /api/church/holyrics/schedules/:id/sync`
- Restringir configuração a pastor/admin, e sincronização à mesma autorização usada para editar/acessar a escala.
- Registrar a rota em `api/server.ts`.
- Rodar novamente os testes até passarem.

## Task 2: Sincronização da escala

**Files:** `api/src/interfaces/adapters/holyricsAdapters.ts`, `api/tests/holyrics.test.ts` ou suíte equivalente.

- Escrever testes de serviço para escala com todas as músicas encontradas, escala parcialmente encontrada, resultado ambíguo, escala sem músicas, token ausente e falha no `AddLyricsToPlaylist`.
- Rodar os testes para confirmar a falha antes da implementação.
- Buscar a escala de forma tenant-scoped, ordenando `ScheduleMediaItem` por `order` e considerando somente itens `MUSIC`.
- Normalizar acentos, caixa, pontuação e espaços para comparar título/artista; não escolher silenciosamente uma música ambígua.
- Retornar um resultado estável para a interface: `added`, `notFound`, `ambiguous` quando aplicável e indicação de que o destino foi a playlist atual selecionada no Holyrics.
- Tratar parcial como sucesso informativo; falha de conexão como erro claro sem modificar a escala do ChurchApp.
- Rodar a suíte da API até passar.

## Task 3: Configuração de Integrações no frontend

**Files:** novo `web/composables/useHolyrics.ts`, `web/app/pages/admin/configuracoes.vue`.

- Criar o composable seguindo o padrão de `useWhatsApp`, mantendo chamadas HTTP fora da página.
- Adicionar a seção `Integrações` abaixo das integrações administrativas existentes, com:
  - status conectado/não conectado;
  - campo de API key;
  - campo de token;
  - instrução curta para habilitar o API Server e gerar as credenciais no Holyrics;
  - link para a documentação oficial;
  - ações `Conectar`, `Salvar conexão` e `Desconectar`.
- Não preencher novamente os segredos após a leitura; exibir somente estado e mensagens úteis.
- Tratar loading, erro e sucesso sem toast genérico que esconda a causa.
- Rodar lint e typecheck do frontend.

## Task 4: Ação e feedback na escala

**Files:** `web/app/pages/scale.vue`, `web/app/components/Scale/DetailSheet.vue`, `web/composables/useHolyrics.ts` e tipos relacionados.

- Carregar o status da integração na página de escalas e passar o estado para o detalhe da escala.
- Adicionar `Enviar para Holyrics` ao lado de `Tocar sequência`, visível apenas quando conectado e para quem pode gerenciar a escala.
- Abrir feedback estruturado após o envio, com quantidade/lista de músicas adicionadas e lista de músicas não encontradas/ambíguas.
- Informar no próprio fluxo que as músicas são adicionadas à playlist atualmente selecionada no Holyrics.
- Preservar observações específicas já salvas na escala; nesta primeira versão elas continuam como instruções internas do ChurchApp e não serão escritas na ficha global da música no Holyrics.
- Garantir estado de carregamento, bloqueio contra duplo clique e recuperação para tentar novamente.
- Rodar build do frontend e inspeção visual dos arquivos alterados.

## Task 5: Documentação e verificação final

**Files:** `docs/` ou README de integração, além dos arquivos alterados acima.

- Documentar configuração, escopo do MVP, playlist de destino e limitações (músicas precisam existir no Holyrics; credenciais ficam armazenadas por igreja).
- Atualizar a proposta OpenSpec para refletir `api_key` + `token` e a playlist atualmente selecionada, removendo o campo fictício de nome de playlist.
- Rodar `npm run validate` na raiz, revisar `git diff` e confirmar que modificações pré-existentes em `api/node_modules` não foram incluídas.
- Fazer commit somente dos arquivos da integração/documentação e subir para `origin/main`, conforme pedido explícito do usuário.

## Verification checklist

- Conexão válida mostra `Conectado` sem expor segredos.
- Credenciais inválidas não ficam salvas.
- Igreja sem conexão não vê a ação na escala e a API recusa sincronização.
- Escala mista mostra exatamente adicionadas e não encontradas/ambíguas.
- Falha no Holyrics não altera a escala do ChurchApp.
- `npm run validate` passa.
- Commit contém apenas as alterações desta integração e é confirmado no remoto.
