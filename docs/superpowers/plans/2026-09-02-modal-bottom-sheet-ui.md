# Modal and Bottom Sheet UI Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unificar as telas modais e bottom sheets do ChurchApp em uma experiência moderna, consistente, responsiva e acessível, preservando os fluxos e contratos atuais.

**Architecture:** `UtilsResponsiveOverlay` será a fundação única para overlays. Os componentes usarão uma casca visual compartilhada — cabeçalho, área rolável e ações — com variantes para formulário, confirmação, detalhe e fullscreen. A migração será incremental por domínio, sem alterar API, banco ou autenticação.

**Tech Stack:** Nuxt/Vue 3, Vuetify, TypeScript, CSS tokens em `theme.css`, validação por build e inspeção visual no navegador.

**Spec:** Solicitação do usuário nesta conversa: revisar e modernizar todas as telas modais e bottom sheets do ChurchApp antes dos ajustes funcionais.

## Global Constraints

- Não alterar API, banco de dados, Keycloak, permissões, cargos ou vínculos de igreja.
- Não adicionar biblioteca visual nova; reutilizar Vuetify e os tokens existentes.
- Preservar `v-model`, eventos emitidos, textos funcionais e comportamento de salvar/cancelar.
- Todos os overlays devem funcionar em 360 px, 390 px, 768 px e desktop de 1280 px ou mais.
- Manter suporte ao tema escuro, safe-area do mobile e `prefers-reduced-motion`.
- Não fazer commit sem solicitação explícita do usuário.

---

### Task 1: Consolidar o contrato visual do overlay

**Files:**
- Modify: `web/app/components/utils/ResponsiveOverlay.vue`
- Modify: `web/app/assets/css/theme.css`
- Test: inspeção visual de um formulário, uma confirmação e um detalhe em mobile e desktop

**Interfaces:**
- Consumes: props e emits atuais de `ResponsiveOverlay`.
- Produces: classes/variantes reutilizáveis para `form`, `confirm`, `detail` e `fullscreen`, sem quebrar os call sites atuais.

- [ ] **Step 1: Definir o contrato visual** — documentar no componente quais props controlam largura, fullscreen, scroll, persistência e classe mobile; manter os valores atuais como defaults.
- [ ] **Step 2: Padronizar a estrutura** — garantir classes estáveis para conteúdo, cabeçalho, corpo rolável e ações, permitindo rodapé fixo quando o conteúdo exceder a altura da viewport.
- [ ] **Step 3: Ajustar os tokens** — usar as variáveis terracota, superfície, borda, radius e sombra já existentes em `theme.css`; remover dependência de cores roxas hard-coded nos estilos compartilhados.
- [ ] **Step 4: Validar sem migração** — abrir os componentes que já usam `ResponsiveOverlay` e confirmar que título, fechamento, scroll, dark mode e ações permanecem intactos.

**Acceptance criteria:** um overlay existente mantém seu comportamento; em mobile o corpo pode rolar sem esconder as ações; em desktop a largura máxima continua respeitada; dark mode e reduced motion continuam funcionando.

---

### Task 2: Migrar confirmações e modais curtos

**Files:**
- Modify: `web/app/components/utils/ConfirmDialog.vue`
- Modify: `web/app/components/Admin/ChurchPlanDialog.vue`
- Modify: `web/app/components/Scale/DeclineDialog.vue`
- Modify: `web/app/pages/plans.vue`
- Modify: `web/app/pages/prayer.vue`

**Interfaces:**
- Consumes: eventos e estados atuais de confirmação, cancelamento e submissão.
- Produces: os mesmos eventos, agora com comportamento bottom sheet no mobile e dialog no desktop.

- [ ] **Step 1: Migrar cada `v-dialog` direto** para `UtilsResponsiveOverlay`, mantendo `max-width`, `persistent` e estados de loading equivalentes.
- [ ] **Step 2: Aplicar o cabeçalho padrão** — título, contexto visual, botão de fechar com `aria-label` e hierarquia clara entre ação primária e cancelamento.
- [ ] **Step 3: Ajustar confirmações destrutivas** — reservar vermelho para ícone, texto e ação destrutiva; não usar borda vermelha pesada no card inteiro.
- [ ] **Step 4: Verificar estados de erro e loading** — nenhuma ação deve desaparecer ou ficar impossível de alcançar durante submissão.

**Acceptance criteria:** os cinco fluxos abrem como bottom sheet no mobile; o botão voltar/cancelar continua seguro; fechar pelo X funciona quando permitido; confirmação destrutiva continua exigindo ação explícita.

---

### Task 3: Migrar os modais antigos de ministério e agenda

**Files:**
- Modify: `web/app/components/Ministery/DetailsView/index.vue`
- Modify: `web/app/components/Ministery/NewMusicModal.vue`
- Modify: `web/app/components/Ministery/NewReferenceModal.vue`
- Modify: `web/app/pages/cultos/index.vue`
- Modify: `web/app/pages/cultos/[id].vue`
- Modify: `web/app/pages/pastoral/visitas.vue`

**Interfaces:**
- Consumes: formulários e callbacks atuais desses componentes.
- Produces: layouts alinhados ao padrão novo, sem duplicar regras de abertura/fechamento.

- [ ] **Step 1: Separar o legado visual do fluxo funcional** — não reescrever regras de negócio; alterar somente wrapper, cabeçalho, espaçamento, responsividade e classes visuais.
- [ ] **Step 2: Substituir padrões compactos antigos** (`v-card-title` solto, `pa-4`, `purple-darken-3`) pelo cabeçalho e tokens compartilhados.
- [ ] **Step 3: Tornar formulários roláveis** e manter as ações visíveis no final do bottom sheet.
- [ ] **Step 4: Conferir o componente legado `DetailsView`** — preservar seu aviso de legado e garantir que suas três janelas não criem overlay incompatível com a página atual.

**Acceptance criteria:** não resta `v-dialog` direto nesses seis fluxos; a experiência mobile é consistente; nenhum campo ou ação fica fora da viewport; os textos e submits continuam iguais.

---

### Task 4: Corrigir scroll e densidade dos formulários responsivos

**Files:**
- Modify: `web/app/components/Ministery/ActivityFormDialog.vue`
- Modify: `web/app/components/Ministery/AssignmentsDialog.vue`
- Modify: `web/app/components/Ministery/ResourceFormDialog.vue`
- Modify: `web/app/components/Ministery/ScheduleFormDialog.vue`
- Modify: `web/app/components/Ministery/SongFormDialog.vue`
- Modify: `web/app/components/Ministery/TaskFormDialog.vue`
- Modify: `web/app/components/Scale/AssignmentsDialog.vue`
- Modify: `web/app/components/Scale/FormDialog.vue`
- Modify: `web/app/pages/admin/configuracoes.vue`
- Modify: `web/app/pages/admin/mensagens.vue`
- Modify: `web/app/pages/admin/ministerios.vue`
- Modify: `web/app/pages/admin/pessoas.vue`
- Modify: `web/app/pages/admin/relatorios.vue`
- Modify: `web/app/pages/ministery/index.vue`
- Modify: `web/app/pages/user.vue`

**Interfaces:**
- Consumes: formulários existentes e seus estados de validação/loading.
- Produces: corpo rolável, rodapé de ações previsível e espaçamento coerente em telas pequenas.

- [ ] **Step 1: Classificar cada overlay** como formulário curto, formulário longo ou fluxo de detalhe; usar `scrollable` nos longos e manter os curtos sem scroll desnecessário.
- [ ] **Step 2: Fixar as ações no fluxo mobile** — o usuário deve conseguir salvar/cancelar sem voltar ao topo; evitar dois rodapés competindo dentro do mesmo sheet.
- [ ] **Step 3: Reduzir somente densidade excessiva** — preservar campos legíveis, toque mínimo adequado e espaçamento entre grupos.
- [ ] **Step 4: Validar validação e teclado** — erros aparecem junto ao campo, não são cobertos pelo rodapé, e o teclado não impede alcançar a ação primária.

**Acceptance criteria:** nenhum formulário longo corta conteúdo; ações permanecem alcançáveis; não há overflow horizontal em 360/390 px; desktop não fica com espaçamento exagerado.

---

### Task 5: Unificar “Mais opções”

**Files:**
- Modify: `web/app/components/layouts/bottomNavigation/index.vue`
- Modify: `web/app/components/Dashboard/quickAccess/index.vue`
- Optional create: `web/app/components/layouts/MoreOptionsList.vue` somente se a lista compartilhada não puder ser extraída sem duplicação.

**Interfaces:**
- Consumes: itens, ícones, permissões e rotas atualmente exibidos nos dois menus.
- Produces: uma única fonte de itens e uma única linguagem visual para o acesso expandido.

- [ ] **Step 1: Comparar os itens** dos dois menus e preservar todos os destinos atualmente disponíveis.
- [ ] **Step 2: Escolher um único título, descrição, avatar/ícone e ordenação** para o fluxo “Mais opções”.
- [ ] **Step 3: Reutilizar a lista** nos dois pontos de entrada, sem duplicar regras de permissão ou navegação.
- [ ] **Step 4: Garantir busca, fechamento e foco** no bottom sheet e no dialog desktop.

**Acceptance criteria:** os dois pontos de entrada mostram os mesmos itens e ações; não há duas nomenclaturas para o mesmo menu; busca e navegação funcionam em mobile e desktop.

---

### Task 6: Melhorar detalhes complexos e overlays aninhados

**Files:**
- Modify: `web/app/pages/platform-admin.vue`
- Modify: `web/app/components/Scale/DetailSheet.vue`
- Modify: `web/app/components/Ministery/SongPickerDialog.vue`
- Modify: `web/app/components/Scale/SongPickerDialog.vue`
- Modify: `web/app/components/Ministery/SongViewerDialog.vue`
- Modify: `web/app/components/Music/PersonalChordsSheet.vue`
- Modify: `web/app/pages/content/playlist.vue`
- Modify: `web/app/pages/content/devotionals/index.vue`
- Modify: `web/app/pages/content/verse.vue`

**Interfaces:**
- Consumes: overlays aninhados, tabs, leitores e actions atuais.
- Produces: hierarquia clara entre overlay pai/filho, fullscreen quando o conteúdo exigir e foco retornando ao elemento de origem.

- [ ] **Step 1: Mapear overlay pai e filho** em cada fluxo para impedir backdrop duplicado, fechamento acidental ou z-index incorreto.
- [ ] **Step 2: Tornar o painel administrativo fullscreen no mobile** quando a largura de 920 px contiver tabs e múltiplas seções; manter dialog largo no desktop.
- [ ] **Step 3: Preservar o padrão de leitura fullscreen** para música/cifra, com fechamento evidente e scroll independente.
- [ ] **Step 4: Testar abrir-fechar repetidamente** overlays aninhados e confirmar que o foco volta ao botão que abriu o fluxo.

**Acceptance criteria:** overlays aninhados não fecham o pai por engano; o usuário sempre identifica onde está; painéis complexos não ficam espremidos em bottom sheets altos demais.

---

### Task 7: Acessibilidade, motion e acabamento visual

**Files:**
- Modify: `web/app/components/OnboardingModal/index.vue`
- Modify: `web/app/components/utils/PageHelpButton.vue`
- Modify: todos os componentes migrados nas Tasks 2–6 que possuem botões somente com ícone
- Modify: `web/app/assets/css/theme.css`

**Interfaces:**
- Consumes: componentes e tokens já padronizados.
- Produces: controles identificáveis por leitor de tela/teclado e acabamento visual consistente com o tema terracota.

- [ ] **Step 1: Adicionar nomes acessíveis** a fechar, voltar, avançar, ajuda, remover e demais botões somente com ícone.
- [ ] **Step 2: Transformar os dots do onboarding em controles de teclado** com `button`, nome acessível e estado selecionado.
- [ ] **Step 3: Aplicar `prefers-reduced-motion`** às transições do onboarding e aos demais movimentos customizados, sem remover feedback essencial.
- [ ] **Step 4: Substituir cores de marca hard-coded** por tokens do tema, mantendo vermelho apenas para destruição/erro e garantindo contraste no dark mode.
- [ ] **Step 5: Conferir tipografia** — manter a fonte de display em títulos de marca/página e evitar seu uso em botões, labels e dados.

**Acceptance criteria:** todos os controles principais têm nome acessível; onboarding funciona por teclado; reduced motion reduz transições; não há roxo arbitrário no fluxo modernizado; contraste permanece legível nos dois temas.

---

### Task 8: Validação visual e regressão

**Files:**
- Test: todos os componentes e páginas alterados nas Tasks 1–7
- Review: `web/app/assets/css/theme.css`

- [ ] **Step 1: Executar verificação de formatação e diff** com `rtk git diff --check` e revisar somente os arquivos desta iniciativa.
- [ ] **Step 2: Executar o build do frontend** com `Set-Location web; rtk npm run build`.
- [ ] **Step 3: Validar a matriz de viewport** em 360x800, 390x844, 768x1024 e 1280x800, cobrindo formulário, confirmação, detalhe, fullscreen e overlay aninhado.
- [ ] **Step 4: Validar estados**: abertura, fechamento, cancelamento, erro, loading, conteúdo longo, teclado mobile, dark mode e reduced motion.
- [ ] **Step 5: Fazer revisão final** conferindo que nenhum contrato de API, autenticação, cargo ou vínculo de igreja foi alterado.

**Acceptance criteria:** build concluído; sem overflow ou ações inacessíveis nos viewports definidos; sem regressão de abertura/fechamento; alterações limitadas à experiência de modal/bottom sheet.

---

## Bloco B — Integridade da migração de servidor, cargos e vínculos

Este bloco trata as solicitações anteriores sobre a troca do servidor `192.168.15.8` para `192.168.15.10`, o backup no `.8`, perda de cargo/vínculo e validação do usuário Jean. Ele deve ser executado separadamente do bloco visual.

### Task 9: Mapear a configuração efetiva dos servidores

**Files:**
- Review: `docker-compose.yml`
- Review: `web/nuxt.config.ts`
- Review: `api/src/interfaces/adapters/authAdapters.ts`
- Review: `api/src/infrastructure/repositories/Auth/ClientAuthRepositoryKeycloak.ts`
- Review: `api/src/application/use-cases/Auth/JwtValidationUseCase.ts`
- Review: `api/src/interfaces/utils/churchContext.ts`

- [ ] **Step 1: Registrar a configuração efetiva** de API, banco, Keycloak e frontend no `.10`, sem salvar valores de senha, tokens ou segredos no relatório.
- [ ] **Step 2: Identificar todas as referências ao `.8`** em código, compose, variáveis de ambiente, scripts e documentação operacional.
- [ ] **Step 3: Mapear o fluxo de identidade**: JWT → usuário local → igreja ativa → `ChurchMembership` → `ChurchRole`/`MembershipRole`.
- [ ] **Step 4: Definir a janela de compatibilidade** para que a aplicação não alterne entre `.8` e `.10` durante a validação.

**Acceptance criteria:** existe uma tabela de origem/destino para cada serviço; o endpoint em produção aponta somente para o destino aprovado; nenhuma credencial aparece em arquivo, diff ou relatório.

### Task 10: Auditar backup do `.8` e banco ativo do `.10`

**Files:**
- Review: `api/src/infrastructure/database/prisma/schema.prisma`
- Review: `api/src/infrastructure/database/prisma/migrations/`
- Create: relatório local não versionado de auditoria, sem dados pessoais completos ou segredos

- [ ] **Step 1: Confirmar que o backup do `.8` é legível** e identificar data, banco, schema e versão das migrations, sem restaurá-lo.
- [ ] **Step 2: Fazer comparação somente leitura** entre `.8` e `.10`: migrations aplicadas, quantidade de usuários, igrejas, memberships, cargos e relações de cargos.
- [ ] **Step 3: Comparar chaves e vínculos** por IDs estáveis, não por nome ou e-mail isoladamente; registrar órfãos, duplicidades e registros ausentes.
- [ ] **Step 4: Classificar a causa provável** como configuração, migration incompleta, banco divergente, seed indevido ou problema de leitura do contexto ativo.

**Acceptance criteria:** a causa é sustentada por evidências reproduzíveis; o backup original não é alterado; nenhuma operação de `DELETE`, `UPDATE`, restore ou overwrite ocorre nesta task.

### Task 11: Validar cargos e vínculos, incluindo Jean

**Files:**
- Review: `api/src/domain/permissions.ts`
- Review: `api/src/application/Services/Auth/AuthorizationService.ts`
- Review: `api/src/infrastructure/database/prisma/migrations/20260714150000_add_church_memberships/migration.sql`
- Review: `api/src/infrastructure/database/prisma/migrations/20260803120000_scoped_role_permissions/migration.sql`
- Review: rotas/repositórios de usuário, igreja, membership e role localizados na auditoria

- [ ] **Step 1: Validar o usuário Jean por identificador seguro** fornecido durante a execução; não usar senha, não armazenar credencial e não depender somente do nome exibido.
- [ ] **Step 2: Conferir a cadeia completa** `User` → `ChurchMembership` → `Crunch`, incluindo `role`, `churchRoleId`, `MembershipRole`, `scope`, `departmentId` e permissões.
- [ ] **Step 3: Comparar o resultado com o backup do `.8`** e distinguir perda real de vínculo de falha de seleção de igreja ativa ou token desatualizado.
- [ ] **Step 4: Repetir a mesma consulta para uma amostra de usuários** com cargos diferentes, para evitar uma correção específica que esconda uma falha sistêmica.

**Acceptance criteria:** o relatório informa claramente cargo efetivo, igreja vinculada, cargos complementares, permissões e divergências; Jean é validado sem expor dados sensíveis; a causa sistêmica fica reproduzível.

### Task 12: Corrigir divergências de forma reversível

**Files:**
- Create: `api/scripts/audit-membership-integrity.ts`
- Create: `api/scripts/repair-membership-integrity.ts` somente após a auditoria e autorização explícita
- Modify: nenhum arquivo de produção até a causa ser confirmada

- [ ] **Step 1: Implementar primeiro o modo somente leitura** do auditor, com saída de IDs mascarados, contagens e divergências agrupadas por tipo.
- [ ] **Step 2: Gerar um plano de reparo idempotente** que mostre cada alteração pretendida antes de executá-la.
- [ ] **Step 3: Preparar rollback** por meio de snapshot/export dos registros afetados e log de `before/after`, sem incluir senhas ou tokens.
- [ ] **Step 4: Executar qualquer reparo somente após autorização explícita**, em transação, com `dry-run` padrão e validação posterior.
- [ ] **Step 5: Confirmar que a aplicação lê o vínculo corrigido** após renovação controlada de sessão/token e seleção da igreja correta.

**Acceptance criteria:** dry-run reproduz as divergências; reparo pode ser repetido sem duplicar memberships/roles; rollback é possível; nenhum registro não relacionado é alterado.

### Task 13: Smoke test operacional pós-correção

**Files:**
- Test: login, seleção de igreja, tela de perfil, administração de pessoas e tela que depende de permissões
- Review: logs da API e respostas das rotas de usuário/membership/role

- [ ] **Step 1: Testar com uma conta autorizada pelo usuário**, inserida diretamente no navegador durante a sessão; nunca colocar senha em arquivo, script, relatório ou plano.
- [ ] **Step 2: Validar o caso Jean**: nome, igreja ativa, cargo exibido, permissões e acesso às telas esperadas.
- [ ] **Step 3: Testar logout/login e renovação de token** para confirmar que a correção não depende de cache local.
- [ ] **Step 4: Repetir com usuário sem cargo privilegiado** e com um usuário de outra igreja para verificar isolamento de dados.
- [ ] **Step 5: Registrar evidência mínima**: horário, ambiente, resultado e IDs mascarados; remover qualquer dado sensível usado no teste.

**Acceptance criteria:** usuários mantêm vínculo e cargo após novo login; permissões seguem o escopo da igreja/ministério; não há vazamento entre igrejas; o backup `.8` permanece intacto.

## Ordem de execução

Para o problema de dados, executar primeiro 9 → 10 → 11 → 12 → 13. Não executar a Task 12 antes da auditoria e autorização explícita.

Para a interface, executar 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8. As Tasks 2, 3, 4 e 5 podem ser trabalhadas em paralelo depois que a Task 1 estiver validada, desde que cada uma preserve os contratos existentes.

## Entrega

Ao terminar cada task, revisar o diff e registrar os arquivos tocados. Commits ficam fora deste plano até autorização explícita do usuário.
