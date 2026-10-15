# Escalas Configuráveis por Ministério — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que cada igreja configure os campos, funções e tarefas das escalas por ministério, mantendo o fluxo do Louvor e escolhendo responsáveis culto a culto.

**Architecture:** Salvar uma configuração JSON versionada em `Department`, validada no servidor e isolada pelo `crunchId`. A API deriva uma configuração inicial para ministérios antigos sem persistir durante a leitura; ao criar uma escala, salva o horário de chegada e copia checklist/funções configuradas para a ocorrência, sem reutilizar pessoas.

**Tech Stack:** Vue 3, Nuxt 4, TypeScript, Fastify, Prisma 6, PostgreSQL, Jest e testes puros com `node:test`.

**Spec:** `docs/superpowers/specs/2026-10-06-configuracao-de-escalas-por-ministerio-e-mensagens-design.md` — seções “Ministérios e modelos padrão”, “Comportamento por ministério”, “Fluxos” e “Modelo de dados e API”.

## Global Constraints

- “Louvor” preserva o fluxo atual, inclusive ensaio, repertório, materiais e seleção de funções.
- Configurações são por ministério e igreja; leitura e gravação respeitam o `crunchId` e as permissões atuais.
- Alterar um modelo afeta novas escalas, nunca escalas ou registros históricos existentes.
- Data/horário do culto e vínculo opcional com um culto existente continuam usando os campos/fluxos atuais.
- `ScheduleAssignment.userId` é obrigatório: cada função mantida deve ter uma pessoa antes de salvar; funções não usadas podem ser removidas. Checklist pode ficar sem responsável.
- Santa Ceia só aparece quando habilitada no modelo; funções não recebem nomes por histórico, rodízio ou preenchimento automático.
- “Outro/Personalizado” usa somente os blocos, funções e tarefas conhecidos pelo ChurchApp; não será um construtor de campos arbitrários.

## Review Focus

- Configuração ausente ou de versão/estrutura inválida: ministério antigo deve receber defaults sem escrita silenciosa; configuração enviada inválida deve ser rejeitada (`api/tests/departmentScheduleConfig.test.ts`).
- Aliases antigos `MUSIC` e `WORSHIP`: ambos preservam o modelo do Louvor e não criam opção duplicada (`web/tests/departmentScheduleConfig.test.ts`).
- Usuário de outra igreja ou sem permissão de gestão tenta ler/gravar configuração: operação deve ser negada sem vazamento (`api/tests/churchDepartment.test.ts`).
- Santa Ceia desabilitada ou desmarcada: nenhum item extra é criado; habilitada e marcada, copia apenas itens configurados para a nova ocorrência (`api/tests/churchDepartmentSchedule.test.ts`).
- Funções em branco, remoção de função e alteração do modelo após escala criada: validação impede salvar linha sem pessoa e escala antiga permanece igual (`web/tests/scheduleFormConfig.test.ts`, `api/tests/churchDepartmentSchedule.test.ts`).

---

### Task 1: Contrato versionado, presets e resolução de compatibilidade

**Files:**
- Create: `api/src/application/Services/Department/DepartmentScheduleConfig.ts`
- Create: `api/tests/departmentScheduleConfig.test.ts`
- Create: `web/app/utils/departmentScheduleConfig.ts`
- Create: `web/tests/departmentScheduleConfig.test.ts`
- Modify: `web/composables/useDepartments.ts`

**Interfaces:**
- API produces `DepartmentScheduleConfig` version 1 and `resolveDepartmentScheduleConfig(value: unknown, departmentType: string): DepartmentScheduleConfig` for persisted or legacy data.
- API produces `parseDepartmentScheduleConfig(value: unknown): DepartmentScheduleConfig`, rejecting unknown versions, malformed blocks, too many entries, blank labels and oversized labels with `DomainError`.
- Web produces matching `DepartmentScheduleConfig`, `getDepartmentSchedulePreset(type: string)` and `resolveDepartmentScheduleConfig(config, type)` for create/edit forms.
- Version-1 JSON shape: `version`, `fields` (`arrival`, `rehearsal`, `songs`, `materials`, `roles`, `checklist` booleans), `roles: string[]`, `checklistItems: { templateKey: string; title: string }[]`, and `communion: { enabled: boolean; roles: string[]; checklistItems: { templateKey: string; title: string }[] }`.

- [x] **Step 1: Write failing API tests** for defaults of `WORSHIP`/legacy `MUSIC`, `DEACONATE` (arrival on, rehearsal off, Dízimo/Recepção/Apoio and water/cups checklist), and rejection of unsupported version, malformed field, blank/oversized task labels and duplicate checklist keys.
- [x] **Step 2: Run `npm run test:ci -- --runTestsByPath tests/departmentScheduleConfig.test.ts` in `api/`**; confirm the failures are missing behavior, not test setup errors.
- [x] **Step 3: Implement the API config type, parser and legacy resolver** in `DepartmentScheduleConfig.ts`; keep defaults non-persisting and do not mutate input JSON.
- [x] **Step 4: Rerun the API config test** and confirm it passes.
- [x] **Step 5: Write failing web utility tests** for all seven presets, the single Louvor choice with `MUSIC` alias, switching presets without mutating a prior config, and resolving missing config for old departments.
- [x] **Step 6: Run `node --experimental-strip-types --test tests/departmentScheduleConfig.test.ts` in `web/`** and confirm it fails on the expected missing exports/behavior.
- [x] **Step 7: Implement web presets and resolution plus the matching composable types**; defaults: Louvor keeps rehearsal/songs/materials/roles; Diaconato has arrival, no rehearsal, Dízimo/Recepção/Apoio, editable checklist and optional Santa Ceia; KIDS, RECEPTION, MEDIA, INTERCESSION and OTHER use the known blocks and are editable.
- [x] **Step 8: Rerun the web utility test** and confirm it passes.

### Task 2: Persistir configuração no ministério com isolamento da igreja

**Files:**
- Modify: `api/src/infrastructure/database/prisma/schema.prisma`
- Create: `api/src/infrastructure/database/prisma/migrations/<timestamp>_add_department_schedule_config/migration.sql`
- Modify: `api/src/interfaces/adapters/churchDepartment/context.ts`
- Modify: `api/src/interfaces/adapters/churchDepartment/types.ts`
- Modify: `api/src/interfaces/adapters/churchDepartment/department.ts`
- Modify: `api/tests/churchDepartment.test.ts`
- Modify: `web/composables/useDepartments.ts`

**Interfaces:**
- Prisma produces nullable `Department.scheduleConfig Json?`.
- `departmentSelect` and `DepartmentWithStats` expose `scheduleConfig`.
- Existing create/update department APIs accept optional `scheduleConfig`; create defaults from `type` if omitted, update validates and writes only when supplied, and reads resolve legacy defaults without persisting them.

- [x] **Step 1: Add failing adapter tests** for create/update round-trip, invalid payload rejection, legacy read without a write, and a user from another tenant being unable to read/update the department config.
- [x] **Step 2: Run the focused API tests** and verify the new assertions fail for the expected missing config behavior.
- [x] **Step 3: Add nullable JSON field and additive SQL migration**; do not backfill or rewrite existing departments.
- [x] **Step 4: Implement config selection, parsing, legacy resolution and persistence** in the department context/adapter and update the frontend DTOs.
- [x] **Step 5: Rerun `npm run test:ci -- --runTestsByPath tests/churchDepartment.test.ts tests/departmentScheduleConfig.test.ts` in `api/`**; confirm pass and tenant denial assertions.

### Task 3: Salvar chegada e copiar defaults somente para a nova escala

**Files:**
- Modify: `api/src/infrastructure/database/prisma/schema.prisma`
- Create: `api/src/infrastructure/database/prisma/migrations/<timestamp>_add_schedule_arrival_at/migration.sql`
- Modify: `api/src/interfaces/adapters/churchDepartment/schedule.ts`
- Modify: `api/src/interfaces/adapters/churchDepartment/scheduleChecklist.ts`
- Modify: `api/tests/churchDepartmentSchedule.test.ts`
- Modify: `api/tests/churchDepartmentScheduleChecklist.test.ts`
- Modify: `web/composables/useDepartments.ts`
- Modify: `web/app/components/Scale/types.ts`

**Interfaces:**
- Prisma produces nullable `Schedule.arrivalAt DateTime?`.
- Schedule create/update DTOs accept `arrivalTime?: string | null`; API combines it with the schedule’s local service date, validates it, and returns `arrivalAt`.
- Schedule creation resolves the department config and snapshots its checklist items on the new occurrence. Santa Ceia extras are added only when both the config enables it and the occurrence is marked as Santa Ceia.
- Editing a model never bulk-updates existing `ScheduleChecklistItem` rows; editing an existing scale preserves its current checklist behavior.

- [x] **Step 1: Write failing API tests** for valid/invalid arrival time, configured checklist snapshot, Santa Ceia enabled/disabled behavior, no retroactive mutation, and legacy Diaconato defaults.
- [x] **Step 2: Run the focused API tests** and verify they fail on missing arrival/config behavior.
- [x] **Step 3: Add `arrivalAt` and an additive migration**; keep it nullable for existing rows.
- [x] **Step 4: Implement DTO validation, local-date/time composition, schedule response selection and occurrence-specific checklist creation** using the config resolver.
- [x] **Step 5: Rerun `npm run test:ci -- --runTestsByPath tests/churchDepartmentSchedule.test.ts tests/churchDepartmentScheduleChecklist.test.ts` in `api/`**; confirm pass and unchanged legacy tests.

### Task 4: Configurar ministérios nas duas entradas de cadastro

**Files:**
- Create: `web/app/components/Ministery/DepartmentScheduleConfigFields.vue`
- Modify: `web/app/pages/admin/ministerios.vue`
- Modify: `web/app/pages/ministery/index.vue`
- Modify: `web/composables/useDepartments.ts`
- Test: `web/tests/departmentScheduleConfig.test.ts`

**Interfaces:**
- Shared component consumes `modelValue: DepartmentScheduleConfig` and emits `update:modelValue`; it shows known-block toggles, editable role labels, editable ordered checklist labels and Santa Ceia settings.
- Both ministry creation entry points use the same preset resolver and editor. Type changes initialize the selected preset; changing a type for an existing department does not silently discard its custom config.
- Ministry options show one “Louvor” entry using `WORSHIP`, retain support for existing `MUSIC`, and include `DEACONATE`.

- [ ] **Step 1: Add failing tests** for preset selection, preserving user-edited config when reopening edit, and not duplicating Louvor aliases.
- [ ] **Step 2: Run the web utility test and verify these assertions fail** before component integration.
- [ ] **Step 3: Implement the shared editor and wire its config through create/edit/save in both pages**; show custom blocks only after choosing “Personalizar”, without changing existing module permissions.
- [ ] **Step 4: Rerun the utility tests** and inspect both forms at mobile and desktop widths for labels, keyboard operation and overflow.

### Task 5: Aplicar o modelo nos formulários de escala

**Files:**
- Create: `web/app/utils/scheduleFormConfig.ts`
- Create: `web/tests/scheduleFormConfig.test.ts`
- Modify: `web/app/components/Scale/FormDialog.vue`
- Modify: `web/app/components/Ministery/ScheduleFormDialog.vue`
- Modify: `web/app/pages/ministery/[id].vue`
- Modify: `web/app/pages/scale.vue`
- Modify: `web/composables/useDepartments.ts`

**Interfaces:**
- `getScheduleFormDefinition(config: DepartmentScheduleConfig, isCommunionService: boolean)` returns the visible known blocks and role suggestions for one occurrence.
- `validateScheduleRoleDrafts(assignments)` returns the missing role labels; the UI blocks save until each retained role has a person or the row is removed.
- Both scale entry points use the same rules. Arrival is submitted as `arrivalTime`; Louvor keeps its existing fields and behavior; Diaconato hides rehearsal by default; no person is copied from the last schedule.

- [ ] **Step 1: Write failing unit tests** for block visibility, Diaconato arrival/no rehearsal, Louvor parity, Santa Ceia role suggestions, missing-assignee validation and removal of an unused row.
- [ ] **Step 2: Run `node --experimental-strip-types --test tests/scheduleFormConfig.test.ts` in `web/`** and confirm failures correspond to the missing helpers.
- [ ] **Step 3: Implement the pure form-definition/validation helpers** and update both forms to consume them; preserve current song/resource and occurrence-link flows.
- [ ] **Step 4: Rerun the helper tests** and run the existing scale regression test `node --experimental-strip-types --test tests/scaleSchedule.test.ts`.
- [ ] **Step 5: Build the web app** with `npm run build` in `web/` and verify the form at mobile and desktop widths.

### Task 6: Verificação integrada da configuração de escalas

**Files:**
- Test: `api/tests/departmentScheduleConfig.test.ts`
- Test: `api/tests/churchDepartment.test.ts`
- Test: `api/tests/churchDepartmentSchedule.test.ts`
- Test: `api/tests/churchDepartmentScheduleChecklist.test.ts`
- Test: `web/tests/departmentScheduleConfig.test.ts`
- Test: `web/tests/scheduleFormConfig.test.ts`
- Test: `web/tests/scaleSchedule.test.ts`

- [ ] **Step 1: Run API suite** with `npm run test:ci` from `api/`; record any unrelated pre-existing failure by test name rather than suppressing it.
- [ ] **Step 2: Run web utility regressions** with `node --experimental-strip-types --test tests/*.test.ts` from `web/` where compatible; otherwise execute the affected tests individually and report incompatible legacy test imports.
- [ ] **Step 3: Run API typecheck and web build** with `npm run typecheck` in `api/` and `npm run build` in `web/`.
- [ ] **Step 4: Apply the manual Impeccable detector once** to the changed web targets and do one bounded responsive review, fixing only the findings from that pass.
