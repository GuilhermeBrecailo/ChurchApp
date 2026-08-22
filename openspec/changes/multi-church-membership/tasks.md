## 1. Backend — Schema e Migration

- [x] 1.1 Adicionar model `ChurchMembership` ao schema Prisma com relações para `User`, `Crunch` e `ChurchRole`
- [x] 1.2 Adicionar relações `memberships` em `User`, `Crunch` e `ChurchRole`
- [x] 1.3 Criar migration para a nova tabela
- [x] 1.4 Criar script/migration de backfill: para cada `User.crunchId`, criar membership com `role`, `churchRoleId`, `canManageMembers` e `isPrimary: true`
- [x] 1.5 Manter campos legados `User.crunchId`, `User.role` e `User.churchRoleId` durante a fase de transição

## 2. Backend — Contexto Ativo e Segurança

- [x] 2.1 Criar helper para resolver igreja ativa a partir de `X-Church-Id` ou membership primária
- [x] 2.2 O helper deve validar que o usuário possui `ChurchMembership` ativa naquela igreja
- [x] 2.3 O helper deve retornar `activeChurchId`, `membership.role`, `membership.churchRole` e permissões efetivas
- [x] 2.4 Substituir checagens administrativas baseadas em `user.role` por membership nos endpoints migrados

## 3. Backend — Auth, Me, Igreja e Convite

- [x] 3.1 Atualizar `GET /api/me` para retornar `memberships[]` e `activeChurch`
- [x] 3.2 Atualizar criação de igreja para criar membership primária do pastor titular
- [x] 3.3 Atualizar join por convite para criar membership adicional quando o usuário já possui outra igreja
- [x] 3.4 Garantir que usuário já vinculado à igreja do convite não cria duplicidade

## 4. Backend — Endpoints de Igreja

- [x] 4.1 Migrar endpoints de membros/admin para usar igreja ativa validada
- [x] 4.2 Migrar endpoints de ministérios e escalas para usar igreja ativa validada
- [x] 4.3 Migrar endpoints de conteúdo da igreja, notificações, relatórios, cargos e configurações para usar igreja ativa validada — auditado: `announcementAdapters`, `dailyVerseAdapters`, `devotionalAdapters`, `postAdapters`, `reportAdapters`, `churchRoleAdapters` e `userAdapters.updateOwnChurch` já resolvem `activeChurchId` via `resolveActiveChurchContext`/`request.churchContext`; `notificationAdapters` é escopado por `userId` (não por igreja), então não se aplica
- [x] 4.4 Revisar queries que usam `user.crunchId!` e substituir por `activeChurchId` — os 13 arquivos com esse grep já usam `user.crunchId!` sobre o objeto retornado por `getCurrentUser()`, que sobrescreve `crunchId` com `context.activeChurchId` antes de qualquer query (o nome do campo confunde o grep, mas o valor já é o ativo). Achado à parte: `crunchAdapters.ts`/`CrunchRoutes.ts` e `departamentAdapters.ts`/`DepartamentRoutes.ts` são CRUD legado sem nenhuma checagem de tenant, mas **não estão registrados em `server.ts`** — código morto inalcançável, não uma vulnerabilidade ativa; deixado como está por estar fora do escopo desta change (ver aviso ao usuário)

## 5. Frontend — Estado e API

- [x] 5.1 Atualizar `AuthUser` em `useAuth.ts` com `memberships[]`, `activeChurchId` e `activeChurch`
- [x] 5.2 Persistir a igreja ativa em cookie/localStorage por usuário
- [x] 5.3 Atualizar `customFetch` para enviar `X-Church-Id` em chamadas autenticadas quando existir igreja ativa
- [x] 5.4 Atualizar middleware para considerar usuário com pelo menos um membership como `hasChurch`

## 6. Frontend — Seleção de Igreja

- [x] 6.1 Adicionar seletor de igreja no AppBar ou perfil quando houver mais de um membership ativo
- [x] 6.2 Ao trocar igreja, atualizar contexto ativo, recarregar `/api/me` e limpar estados dependentes de igreja
- [x] 6.3 Exibir role/cargo conforme a igreja ativa
- [x] 6.4 Garantir que dashboard, escalas, ministérios, admin e perfil reflitam a igreja ativa — `handleChurchChange` no AppBar (`web/app/components/layouts/appBar/index.vue`) trocava de igreja e só fazia `router.push("/")`, que é um no-op se o usuário já estava em `/`; qualquer tela com dados carregados em `onMounted` (dashboard, escalas, ministérios, qualquer página de admin, perfil) ficava com dado da igreja anterior até um refresh manual. Trocado para `reloadNuxtApp({ path: "/" })`, que reseta todo o estado do app e recarrega já com a igreja nova.

## 7. Testes e Validação

- [~] 7.1 Testar usuário com uma única igreja para garantir compatibilidade — coberto por teste automatizado (`api/tests/churchContext.test.ts`); clique-através real com conta de igreja única ainda pendente do usuário
- [~] 7.2 Testar usuário com duas igrejas alternando contexto — coberto por teste automatizado (`resolveActiveChurchContext` troca de contexto ao mudar `x-church-id`); clique-através real alternando pelo seletor do AppBar ainda pendente do usuário
- [~] 7.3 Testar que membro de uma igreja não acessa dados de outra via `X-Church-Id` — coberto por teste automatizado (`x-church-id` de igreja sem membership nunca vira `activeChurchId`); teste real com duas contas/igrejas ainda pendente do usuário
- [~] 7.4 Testar roles diferentes por igreja — coberto por teste automatizado (mesmo usuário resolve PASTOR numa igreja e MEMBRO noutra); teste real ainda pendente do usuário
- [x] 7.5 Rodar validações backend/frontend aplicáveis — `npm run validate` verde (lint + typecheck + testes + build web)
