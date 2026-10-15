# Modelos e Interface de Mensagens — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar a aba Mensagens mais consistente com o restante do ChurchApp e oferecer modelos sugeridos que cada igreja possa salvar, editar e remover sem duplicar ou enviar automaticamente.

**Architecture:** Manter as rotas e o fluxo de envio existentes. Exibir quatro sugestões editáveis na aba Modelos e identificar cópias salvas com uma chave estável por igreja; o backend faz criação idempotente sem sobrescrever conteúdo existente. A interface usa a paleta e os componentes administrativos já existentes.

**Tech Stack:** Vue 3, Nuxt 4, TypeScript, Fastify, Prisma 6, PostgreSQL, Jest e testes puros com `node:test`.

**Spec:** `docs/superpowers/specs/2026-10-06-configuracao-de-escalas-por-ministerio-e-mensagens-design.md` — seção “Aba Mensagens”.

## Global Constraints

- A interface mantém a paleta atual e segue os padrões visuais administrativos já usados pelo ChurchApp.
- Sugestões: boas-vindas a visitantes, agradecimento pós-culto, aviso de culto e aniversário.
- Cada igreja edita e remove sua própria cópia; os modelos já cadastrados não são alterados nem duplicados.
- Abrir/escolher uma sugestão nunca envia mensagem nem ativa regra automática.
- Envio manual, regras e histórico preservam o comportamento e as permissões existentes.
- Não mudar integrações WhatsApp nem o formato de automações nesta entrega.

## Review Focus

- Reabrir sugestão já salva após editar nome/conteúdo: identificar a cópia pela chave estável e abrir edição sem criar outra (`api/tests/messageAdapters.test.ts`, `web/tests/messageTemplateSuggestions.test.ts`).
- Repetir gravação concorrente ou trocar de tenant: não sobrescrever modelo existente nem expor cópia de outra igreja (`api/tests/messageAdapters.test.ts`).
- Clicar na sugestão com WhatsApp desconectado: apenas abre/preenche formulário, nenhum envio ou regra (`web/tests/messageTemplateSuggestions.test.ts`).
- Igreja sem modelos ou com sugestões todas salvas: estados vazios e ações continuam claros e acessíveis (`web/tests/messageTemplateSuggestions.test.ts`, revisão responsiva da página).
- Templates legados sem chave: continuam listados, selecionáveis, editáveis e removíveis sem migração de conteúdo (`api/tests/messageAdapters.test.ts`).

---

### Task 1: Persistir a identidade da sugestão sem alterar templates existentes

**Files:**
- Modify: `api/src/infrastructure/database/prisma/schema.prisma`
- Create: `api/src/infrastructure/database/prisma/migrations/<timestamp>_add_message_template_suggestion_key/migration.sql`
- Modify: `api/src/interfaces/adapters/messageAdapters.ts`
- Modify: `api/tests/messageAdapters.test.ts`
- Modify: `web/composables/useMessages.ts`

**Interfaces:**
- Prisma adds nullable `MessageTemplate.suggestionKey String?` and `@@unique([crunchId, suggestionKey])`; existing rows remain `null` and unchanged.
- `MessageTemplate` exposes optional `suggestionKey`; normal `createTemplate({ name, body })` remains unchanged.
- Suggested create accepts one of `visitor_welcome`, `post_service_thanks`, `service_notice`, `birthday`; API scopes by current `crunchId` and uses upsert/no-op on existing key so repeated save returns the tenant’s saved row without overwriting its edits.
- Update and delete continue to target only templates belonging to the current tenant.

- [ ] **Step 1: Write failing API tests** for first suggested save, repeat save preserving edited body/name, rejected unknown key, tenant-scoped lookup, and legacy template create/update/delete without a key.
- [ ] **Step 2: Run `npm run test:ci -- --runTestsByPath tests/messageAdapters.test.ts` in `api/`** and verify failures are due to missing suggestion-key behavior.
- [ ] **Step 3: Add the nullable field, additive unique migration, DTO validation and idempotent tenant-scoped adapter path**; never update the saved row during suggested create.
- [ ] **Step 4: Rerun the focused API tests** and confirm existing send/rule tests still pass.

### Task 2: Catálogo puro de sugestões e estado “já salvo”

**Files:**
- Create: `web/app/utils/messageTemplateSuggestions.ts`
- Create: `web/tests/messageTemplateSuggestions.test.ts`
- Modify: `web/composables/useMessages.ts`

**Interfaces:**
- `MESSAGE_TEMPLATE_SUGGESTIONS` defines exactly the four approved keys, display names and editable starter bodies.
- `getSuggestedTemplateState(suggestion, templates)` returns `"AVAILABLE"` or the matching saved `MessageTemplate`; matching is by `suggestionKey`, never by mutable name/body.
- `createTemplate` DTO accepts the optional approved `suggestionKey` only for a suggestion save; regular template creation stays keyless.

- [ ] **Step 1: Write failing tests** asserting the exact four keys, stable match after the saved name/body change, available state when no saved copy exists and no automatic-send behavior in the suggestion selection helper.
- [ ] **Step 2: Run `node --experimental-strip-types --test tests/messageTemplateSuggestions.test.ts` in `web/`** and verify expected missing-helper failures.
- [ ] **Step 3: Implement the typed catalog/state helper and composable DTO field** without adding network/send calls to the helper.
- [ ] **Step 4: Rerun the utility test** and confirm pass.

### Task 3: Integrar sugestões à aba Modelos e alinhar a hierarquia visual

**Files:**
- Modify: `web/app/pages/admin/mensagens.vue`
- Modify: `web/app/assets/css/theme.css` only if existing shared utility classes cannot express the responsive suggestion layout
- Test: `web/tests/messageTemplateSuggestions.test.ts`

**Interfaces:**
- A suggestion not yet saved opens the existing create-template dialog with name/body prefilled; save includes its stable key.
- A saved suggestion shows “Salvo” and opens that exact existing tenant template for editing; deletion remains the existing explicit delete flow.
- Header, subtabs, suggestion cards, template list, loading/empty/error states and forms use the same administrative spacing, surfaces, border and focus patterns as neighboring ChurchApp pages; retain current palette and labels.
- The create/save path never calls `sendNow` or rule APIs.

- [ ] **Step 1: Extend failing state tests** for available/saved button labels and selection resolving to create versus edit without sending.
- [ ] **Step 2: Run the focused web utility test** and confirm the new expectations fail before changing the page.
- [ ] **Step 3: Render the four suggestion cards in the Modelos tab** and wire create/edit/save with the existing dialog and `suggestionKey`; do not change the Enviar, Regras, Histórico or Aniversariantes behavior.
- [ ] **Step 4: Rerun the utility tests**, build with `npm run build` from `web/`, and review the page at mobile and desktop widths for keyboard focus, overflow and empty/error/loading states.
- [ ] **Step 5: Run the manual Impeccable detector once** against `web/app/pages/admin/mensagens.vue` and any changed CSS; fix the findings in one bounded pass.

### Task 4: Verificação integrada de Mensagens

**Files:**
- Test: `api/tests/messageAdapters.test.ts`
- Test: `api/tests/messageRuleScheduler.test.ts`
- Test: `web/tests/messageTemplateSuggestions.test.ts`

- [ ] **Step 1: Run `npm run test:ci` from `api/`** and verify template, rule and scheduler tests pass.
- [ ] **Step 2: Run `node --experimental-strip-types --test tests/messageTemplateSuggestions.test.ts` from `web/`** and verify all suggestion-state cases pass.
- [ ] **Step 3: Run `npm run typecheck` from `api/` and `npm run build` from `web/`**; report existing unrelated failures by name if any.
- [ ] **Step 4: Confirm the final diff contains no automatic WhatsApp send/rule activation path and no commit or deployment.**
