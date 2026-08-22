# Admin Navigation Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `web/app/pages/admin.vue`'s 9-tab horizontal bar (9506 lines,
one file) with a 6-row hub screen at `/admin`, each row its own route/file, and
split the SUPER_ADMIN platform view into its own `/platform-admin` route.

**Architecture:** Nuxt file-based routing. `admin.vue` (a file) becomes
`admin/index.vue` (a directory with an index route) via a pure rename in Task 1,
then each of the 9 old tabs is extracted one at a time into a sibling file under
`admin/`, verified working before moving to the next. The old tab bar shrinks by
one tab per task and never coexists with the new hub UI — the hub UI is only
switched on in the final admin-side task, once the tab bar is empty. No backend
or composable changes anywhere in this plan.

**Tech Stack:** Nuxt 4, Vue 3, Vuetify, TypeScript. No frontend test runner
exists (confirmed in `CLAUDE.md`) — verification is `npm run web:build` +
manual click-through as `pastor-demo`, per task.

**Spec:** `docs/superpowers/specs/2026-08-18-admin-navigation-redesign-design.md`

**Resolves the spec's open question on sub-tab deep-linking:** no URL segment
per sub-tab (`/admin/pessoas?tab=cargos` etc.) in this plan. Mensagens already
runs its 5 sub-tabs on local `ref` state today with no deep-linking and no one
has asked for it; adding query-synced sub-tab state to every group is scope
the spec's goals never asked for. If a future need for deep-linking to a
specific sub-tab shows up, it's a small follow-up, not a reason to hold this
plan.

## Global Constraints

- No behavior changes. Every action that works today in a tab must work
  identically after it moves to its own route.
- No composable changes. `useMembers`, `useDepartments`, `useRoster`,
  `useMessages`, `useBirthdays`, `useAttendance`, `useChurchRoles`,
  `usePermissions`, `useDailyVerse`, `useAnnouncements`, `useDevotionals`,
  `usePosts`, `useChurchInvite`, `useChurch`, `useServiceTimes`, `useWhatsApp`,
  `useChurchPlan`, `useAdmin` are consumed as-is; none are modified.
- Every new page under `admin/` gets a back button using the app's existing
  pattern: `router.back()` + `ChevronLeft` from `lucide-vue-next` (see
  `content/bible.vue` or `content/playlist.vue` for the reference
  implementation) in the app-bar/header area.
- Renamed labels: the old "Ministérios" admin tab is titled **"Gestão de
  ministérios"** in its new page; the old "Conteúdo" admin tab is titled
  **"Publicações"** in its new page. Neither the bottom-nav "Ministérios" nor
  "Conteúdo" labels change.
- Color/typography tokens are untouched (`web/app/assets/css/theme.css` — no
  changes anywhere in this plan).
- After every task: `npm run web:build` must succeed with no new errors, and
  the manual click-through listed in that task must pass, before committing.
- Login for manual verification: `pastor-demo@appquadrangular.com` /
  `demo1234` at `http://localhost:3001/login`, Docker stack up
  (`docker compose up -d`), rebuild the web image after each task's changes
  (`docker compose up -d --build web`) since `web` runs a production build with
  no hot-reload.

---

### Task 1: Rename `admin.vue` to `admin/index.vue`

Pure rename, zero content change. This is the foundation that lets every later
task add a sibling file under `admin/` without a routing conflict (Nuxt cannot
have both `pages/admin.vue` and `pages/admin/` resolving `/admin` at once).

**Files:**
- Create: `web/app/pages/admin/index.vue` (identical content to today's
  `admin.vue`)
- Delete: `web/app/pages/admin.vue`

**Interfaces:** None — no code changes, only file location.

- [ ] **Step 1: Move the file**

```bash
mkdir -p web/app/pages/admin
git mv web/app/pages/admin.vue web/app/pages/admin/index.vue
```

- [ ] **Step 2: Build check**

Run: `npm run web:build`
Expected: succeeds with no new errors (identical output to before the rename —
Nuxt resolves `admin/index.vue` to the same `/admin` route `admin.vue` used to).

- [ ] **Step 3: Manual verification**

`docker compose up -d --build web`, log in as `pastor-demo`, tap "Admin" in the
bottom nav. Every existing tab (Plano, Geral, Membros, Ministérios, Conteúdo,
Relatórios, Cargos, Rol, Mensagens) must load exactly as before.

- [ ] **Step 4: Commit**

```bash
git add web/app/pages/admin/index.vue web/app/pages/admin.vue
git commit -m "refactor(web): rename admin.vue to admin/index.vue (no content change)"
```

---

### Task 2: Extract "Configurações" (`Geral` + `Plano` tabs)

**Files:**
- Create: `web/app/pages/admin/configuracoes.vue`
- Modify: `web/app/pages/admin/index.vue` — remove the `Geral` and `Plano`
  `v-tab`/`v-window-item` (or `v-show` section) entries and their now-unused
  script identifiers

**Interfaces:**
- Consumes (composables, unchanged signatures): `useChurchInvite()` →
  `{ getInviteCode, regenerateInviteCode }`; `useChurch()` →
  `{ updateOwnChurch, uploadChurchPhoto }`; `useServiceTimes()` →
  `{ serviceTimes, loadServiceTimes, createServiceTime, updateServiceTime,
  deleteServiceTime }`; `useWhatsApp()` (status/connect/disconnect, already
  used at `getWhatsAppStatus`/`connectWhatsApp`/`disconnectWhatsApp`);
  `useChurchPlan()` → `{ plan: churchPlan, isOnTrial: churchIsOnTrial,
  trialDaysLeft: currentChurchTrialDaysLeft, hasFeature: churchHasFeature }`.
- Produces: nothing consumed by other groups (Configurações is a leaf — no
  other admin group reads its state).

- [ ] **Step 1: Find the exact template boundaries**

```bash
grep -n "activeAdminTab === 'geral'\|activeAdminTab === 'plano'" web/app/pages/admin/index.vue
```

Each match is a `<section v-show="...">` opening tag; its matching
`</section>` is the boundary (match by indentation/bracket depth — these are
top-level sections, not nested inside each other).

- [ ] **Step 2: Find the exact script identifiers to move**

```bash
grep -n "useChurchInvite()\|useChurch()\|useServiceTimes()\|useWhatsApp()\|useChurchPlan()" web/app/pages/admin/index.vue
grep -noE "const (inviteCode|publicChurch|serviceTime|editingServiceTime|whatsapp|churchPlan|churchIsOnTrial|currentChurchTrialDaysLeft|churchHasFeature|proFeatureList)[A-Za-z]*\s*=" web/app/pages/admin/index.vue | sort -u
```

Every `ref`/`computed`/function whose name appears in that output, plus the 5
`const { ... } = useX()` lines themselves, moves to the new file. Do **not**
move `isChurchWideManager`, `accentColor`, `user`, or any identifier also
referenced inside a section that stays in `index.vue` (cross-check with
`grep -n "<identifier>" web/app/pages/admin/index.vue` before deleting each
one — if it still has a match outside the block you just cut, keep a copy in
both files instead of deleting it from `index.vue`).

- [ ] **Step 3: Create `admin/configuracoes.vue`**

Structure: `<script setup lang="ts">` importing the 5 composables above plus
`useRouter`/`ChevronLeft` for the back button, `<template>` with an app-bar
back-button row (mirror `content/bible.vue`'s pattern) followed by the two
extracted `<section>` blocks concatenated (no more tab switching needed inside
this file — Geral and Plano become two stacked sections, or a small internal
`v-tabs` with just those two if the combined content is long; match whichever
reads less cluttered once you see both blocks side by side), then the
extracted `<style scoped>` rules referenced by class names used in those two
sections (search each CSS class from the moved template in `index.vue`'s
`<style>` block and move only the ones not also used by a section staying
behind).

- [ ] **Step 4: Remove the moved content from `index.vue`**

Delete the two `<section>` blocks, the `Geral`/`Plano` tab buttons, and the
script identifiers confirmed single-use in Step 2.

- [ ] **Step 5: Build check**

Run: `npm run web:build`
Expected: succeeds, no unused-import or unresolved-identifier errors.

- [ ] **Step 6: Manual verification**

`docker compose up -d --build web`, log in as `pastor-demo`, navigate to
`/admin/configuracoes` directly (no nav link wired yet — that's Task 8):
- Confirm church profile fields (logo, appearance) load and a save round-trips.
- Confirm "Horários de culto" list loads, and create/edit/delete a test
  service time works.
- Confirm the WhatsApp connection card shows status and the QR-connect flow
  still opens (no need to complete pairing).
- Confirm "Plano" shows the current plan and Pro feature list.
- Back on `/admin`, confirm the old Geral/Plano tabs are gone and every
  remaining tab (Membros, Ministérios, Conteúdo, Relatórios, Cargos, Rol,
  Mensagens) still works.

- [ ] **Step 7: Commit**

```bash
git add web/app/pages/admin/configuracoes.vue web/app/pages/admin/index.vue
git commit -m "refactor(web): extract Configuracoes (Geral+Plano) out of admin/index.vue"
```

---

### Task 3: Extract "Pessoas" (`Membros` + `Cargos` + `Rol` tabs)

**Files:**
- Create: `web/app/pages/admin/pessoas.vue`
- Modify: `web/app/pages/admin/index.vue` — remove the three tabs and their
  script identifiers

**Interfaces:**
- Consumes: `useMembers()` (member list/CRUD, exact export names already in
  `index.vue`'s `} = useMembers();` block), `useChurchRoles()` +
  `usePermissions()` → `{ can }` (Cargos tab), `useRoster()` (Rol tab, same
  shape as `web/composables/useRoster.ts` — `listRosterMembers`,
  `createRosterMember`, `updateRosterMember`, `promoteRosterMember`,
  `markRosterMemberAsLeft`, `restoreRosterMember`, `deleteRosterMember`,
  `checkRosterMemberWhatsApp`).
- Produces: nothing consumed by other groups.

Internal navigation inside this page: a segmented control (same visual
pattern as `messagesSubTabs` in the Mensagens tab — 3 buttons, active state
styled with `purple-darken-3`/tonal) with local `ref` state, defaulting to
"Membros".

- [ ] **Step 1: Find the exact template boundaries**

```bash
grep -n "activeAdminTab === 'membros'\|activeAdminTab === 'cargos'\|activeAdminTab === 'rol'" web/app/pages/admin/index.vue
```

Also search for every `v-dialog`/`UtilsResponsiveOverlay` whose `v-model`
references a member/role/roster dialog-open ref (e.g. `isMemberDialogOpen`,
`isRosterDialogOpen`, role create/edit dialogs) — these currently live
elsewhere in the template (dialogs are declared near the end of the file, not
inline in their tab's section) and must move too.

```bash
grep -n "isMemberDialogOpen\|isRosterDialogOpen\|isChurchRoleDialogOpen\|isCreateRoleDialogOpen\|isEditRoleDialogOpen" web/app/pages/admin/index.vue
```

- [ ] **Step 2: Find the exact script identifiers to move**

```bash
grep -noE "const (member|role|cargo|roster)[A-Za-z]*\s*=" web/app/pages/admin/index.vue | sort -u
grep -n "useMembers()\|useChurchRoles()\|usePermissions()\|useRoster()" web/app/pages/admin/index.vue
```

Cross-check every candidate against `canManageMembersByRole`,
`isChurchWideManager`, `accentColor`, `avatarBgIndigo` — those are shared
helpers other groups also use; keep them in whichever file(s) still reference
them (duplicate the computed definition into the new file if both files need
it — these are cheap, side-effect-free computeds, duplicating them is
correct, not a DRY violation worth avoiding here).

- [ ] **Step 3: Create `admin/pessoas.vue`**

Back-button header, page title "Pessoas", segmented control (Membros / Cargos
/ Rol) driving a local `activeSection` ref, three `v-show="activeSection ===
'...'"` blocks holding the extracted sections, all three dialogs from Step 1
below them.

- [ ] **Step 4: Remove the moved content from `index.vue`**, matching Task 2's
  Step 4 process.

- [ ] **Step 5: Build check** — `npm run web:build`, expect success.

- [ ] **Step 6: Manual verification**

At `/admin/pessoas`:
- Membros: list loads, open a member's detail, confirm role assignment UI
  still works.
- Cargos: list loads, create a test role, assign/remove a permission module,
  delete the test role.
- Rol: list loads, add a test person (visitor), promote to member, mark as
  left, restore, run "Verificar WhatsApp" on an entry with a phone number
  (expect the "WhatsApp não conectado" error, since the test church has no
  WhatsApp session — that error itself confirms the endpoint wiring survived
  the move), delete the test entry.
- Confirm segmented-control switching between the three keeps each section's
  own scroll position/state (no shared-state bleed between them).

- [ ] **Step 7: Commit**

```bash
git add web/app/pages/admin/pessoas.vue web/app/pages/admin/index.vue
git commit -m "refactor(web): extract Pessoas (Membros+Cargos+Rol) out of admin/index.vue"
```

---

### Task 4: Extract "Gestão de ministérios" (`Ministérios` tab)

**Files:**
- Create: `web/app/pages/admin/ministerios.vue`
- Modify: `web/app/pages/admin/index.vue`

**Interfaces:**
- Consumes: `useDepartments()` → `{ getDepartments, getChurchSchedules,
  createDepartment, updateDepartment, deleteDepartment }` (exact names
  confirmed in `index.vue`'s existing destructure).
- Produces: the `departments` list this page loads is **also** needed by
  Task 7 (Relatórios passes `:departments="departments"` into the
  `AdminReports` component for its ministry filter dropdown). Each page loads
  its own independent copy via its own `useDepartments()` call and its own
  `loadDepartments()`/equivalent — composables here are per-call factories,
  not a shared store, so there is no state to synchronize between the two
  pages; verify this assumption in Step 1 of Task 7 before relying on it.

- [ ] **Step 1: Find the exact template boundaries**

```bash
grep -n "activeAdminTab === 'ministerios'" web/app/pages/admin/index.vue
```

Page title in the new file: **"Gestão de ministérios"** (not "Ministérios" —
see Global Constraints).

- [ ] **Step 2: Find the exact script identifiers**

```bash
grep -n "useDepartments()" web/app/pages/admin/index.vue
grep -noE "const (department|ministerio|schedule)[A-Za-z]*\s*=" web/app/pages/admin/index.vue | sort -u
```

Cross-check each against the Relatórios section (`departmentReportRows` in
the pastoral KPI panel reads `departments.value` too) before deleting from
`index.vue` — if Relatórios hasn't been extracted yet (it hasn't, it's
Task 7), `index.vue` still needs its own `departments` data at this point, so
either keep a duplicate `useDepartments()` call in `index.vue` for now (
simplest — this is exactly the kind of state Task 7 will independently
re-derive when it's extracted) or note the temporary duplication in the
commit message.

- [ ] **Step 3: Create `admin/ministerios.vue`** — back-button header, title
  "Gestão de ministérios", the extracted section, its dialogs (department
  create/edit, schedule-related if any were inline).

- [ ] **Step 4: Remove the moved tab button + section from `index.vue`**
  (keep the `useDepartments()` call and `departments` ref in `index.vue` per
  Step 2 if Relatórios still needs it there).

- [ ] **Step 5: Build check** — `npm run web:build`, expect success.

- [ ] **Step 6: Manual verification**

At `/admin/ministerios`: list of ministries loads, open one, confirm
leader/member assignment still works, create a test ministry, delete it.

- [ ] **Step 7: Commit**

```bash
git add web/app/pages/admin/ministerios.vue web/app/pages/admin/index.vue
git commit -m "refactor(web): extract Gestao de ministerios out of admin/index.vue"
```

---

### Task 5: Extract "Publicações" (`Conteúdo` tab)

**Files:**
- Create: `web/app/pages/admin/publicacoes.vue`
- Modify: `web/app/pages/admin/index.vue`

**Interfaces:**
- Consumes: `useDailyVerse()` → `{ listVerses, publishVerse, updateVerse,
  deleteVerse }`; `useAnnouncements()`; `useDevotionals()`; `usePosts()`
  (exact destructured names to be confirmed via Step 2's grep — this tab
  bundles four content types under one editorial screen today).
- Produces: nothing consumed by other groups.

- [ ] **Step 1: Find the exact template boundaries**

```bash
grep -n "activeAdminTab === 'conteudo'" web/app/pages/admin/index.vue
```

Page title in the new file: **"Publicações"** (not "Conteúdo" — see Global
Constraints).

- [ ] **Step 2: Find the exact script identifiers**

```bash
grep -n "useDailyVerse()\|useAnnouncements()\|useDevotionals()\|usePosts()" web/app/pages/admin/index.vue
grep -noE "const (verse|announcement|devotional|post)[A-Za-z]*\s*=" web/app/pages/admin/index.vue | sort -u
```

- [ ] **Step 3: Create `admin/publicacoes.vue`** — back-button header, title
  "Publicações", likely its own internal segmented control if the tab already
  separates Avisos/Devocionais/Versículo/Posts into sub-sections (check the
  extracted template — if it already has internal `v-tabs` or `v-show`
  switches for these four, keep that structure as-is rather than inventing a
  new one).

- [ ] **Step 4: Remove the moved tab button + section from `index.vue`.**

- [ ] **Step 5: Build check** — `npm run web:build`, expect success.

- [ ] **Step 6: Manual verification**

At `/admin/publicacoes`: create and delete one test item of each type (aviso,
devocional, versículo, post) if the UI supports creating each directly from
this screen; confirm public/internal visibility toggles (if present) still
save correctly.

- [ ] **Step 7: Commit**

```bash
git add web/app/pages/admin/publicacoes.vue web/app/pages/admin/index.vue
git commit -m "refactor(web): extract Publicacoes (Conteudo) out of admin/index.vue"
```

---

### Task 6: Extract "Mensagens" tab as-is

This tab is already well-organized internally (5 sub-tabs: Modelos, Enviar
agora, Regras automáticas, Histórico, Aniversariantes — built across the last
two sessions). Only its address changes; no internal restructuring needed.

**Files:**
- Create: `web/app/pages/admin/mensagens.vue`
- Modify: `web/app/pages/admin/index.vue`

**Interfaces:**
- Consumes: `useMessages()`, `useBirthdays()` (unchanged).
- Produces: nothing consumed by other groups.

- [ ] **Step 1: Find the exact template boundaries**

```bash
grep -n "activeAdminTab === 'mensagens'" web/app/pages/admin/index.vue
```

- [ ] **Step 2: Find the exact script identifiers**

```bash
grep -n "useMessages()\|useBirthdays()" web/app/pages/admin/index.vue
grep -noE "const (message|template|rule|log|birthday|send|whatsapp)[A-Za-z]*\s*=" web/app/pages/admin/index.vue | sort -u
```

Note `whatsappConnected` is read by this tab (the "WhatsApp não conectado"
banner) — confirm in Step 2's output whether it's defined here or still
needed by `admin/configuracoes.vue` (Task 2 extracted the WhatsApp connection
card); if both need it, duplicate the computed rather than importing across
page files.

- [ ] **Step 3: Create `admin/mensagens.vue`** — back-button header, title
  "Mensagens", the 5-subtab structure copied verbatim (`messagesSubTabs`
  array and all).

- [ ] **Step 4: Remove the moved tab button + section from `index.vue`.**

- [ ] **Step 5: Build check** — `npm run web:build`, expect success.

- [ ] **Step 6: Manual verification**

At `/admin/mensagens`: all 5 sub-tabs load; create a test template, delete
it; confirm the Aniversariantes sub-tab still shows the automatic-send toggle
and today/week/month filters working (this is the most recently built part of
the app — highest regression risk).

- [ ] **Step 7: Commit**

```bash
git add web/app/pages/admin/mensagens.vue web/app/pages/admin/index.vue
git commit -m "refactor(web): extract Mensagens out of admin/index.vue"
```

---

### Task 7: Extract "Relatórios" tab (pastoral KPIs + Público do culto + Pro reports)

**Files:**
- Create: `web/app/pages/admin/relatorios.vue`
- Modify: `web/app/pages/admin/index.vue`

**Interfaces:**
- Consumes: `useAttendance()` → `{ listAttendance, saveAttendance }` (Público
  do culto panel, Task 4); `AdminReports` component (unchanged, still takes
  `:departments="departments"` prop — this page needs its own
  `useDepartments()` + load call per Task 4's note above); `pastoralLeadership`
  / `departmentReportRows` / `churchReport` computeds (currently in
  `index.vue`'s script — verify in Step 2 whether they depend on `members`/
  `departments` refs that moved to Task 3/4's files; if so, this page needs
  its own `useMembers()`/`useDepartments()` calls too, independent copies,
  same reasoning as Task 4's Interfaces note).
- Produces: nothing consumed by other groups.

- [ ] **Step 1: Find the exact template boundaries**

```bash
grep -n "activeAdminTab === 'relatorios'" web/app/pages/admin/index.vue
```

Two matches expected: the `PlanLock`-wrapped `<AdminReports>` and the
`church-admin-section` with the pastoral KPI grid + Público do culto panel
(built in Task 4 of the ChurchApp roadmap, already using `.report-panel`
styling) — both move together into this one new page.

- [ ] **Step 2: Find the exact script identifiers**

```bash
grep -n "useAttendance()\|churchReport\s*=\|departmentReportRows\s*=\|pastoralLeadership\s*=" web/app/pages/admin/index.vue
grep -noE "const (attendance|churchReport|departmentReportRows|pastoralLeadership)[A-Za-z]*\s*=" web/app/pages/admin/index.vue | sort -u
```

For each computed that reads `members.value` or `departments.value`, add a
local `useMembers()`/`useDepartments()` call + load in this new file (do not
try to share a single instance across page files — see Task 4's Interfaces
note).

- [ ] **Step 3: Create `admin/relatorios.vue`** — back-button header, title
  "Relatórios", KPI grid, Ministérios/Liderança panels, Público do culto
  panel + dialog (from Task 4 — `attendanceForm`, `isAttendanceDialogOpen`,
  `openAttendanceDialog`, `handleSaveAttendance`, `sortedServiceTimes` note:
  `sortedServiceTimes`/`ruleServiceTimeLabel` are also used by
  `admin/mensagens.vue`'s regras form — duplicate these two small computeds
  into this file rather than sharing), `<AdminReports>` behind `PlanLock`.

- [ ] **Step 4: Remove the moved tab button + section from `index.vue`.**
  This is the last tab — after this step `index.vue`'s `v-tabs`/`v-window`
  for the church-admin view should be empty of tabs (only the platform-admin
  shell, if present, remains — that's Task 9).

- [ ] **Step 5: Build check** — `npm run web:build`, expect success.

- [ ] **Step 6: Manual verification**

At `/admin/relatorios`: KPI cards show real numbers, Ministérios/Liderança
panels render, Público do culto shows the totals/list from Task 4's earlier
manual test and "Registrar presença" still upserts correctly (re-run the same
same-culto-same-day double-save check from Task 4 to confirm no duplicate),
Pro-gated `AdminReports` still shows the "disponível apenas no plano Pro"
lock for a non-Pro test church.

- [ ] **Step 7: Commit**

```bash
git add web/app/pages/admin/relatorios.vue web/app/pages/admin/index.vue
git commit -m "refactor(web): extract Relatorios out of admin/index.vue"
```

---

### Task 8: Replace `admin/index.vue` with the hub UI

At this point `admin/index.vue`'s church-admin `v-tabs`/`v-window` is empty
(all 6 groups extracted) — replace its content with the 6-row hub screen
approved in the mockup during brainstorming.

**Files:**
- Modify: `web/app/pages/admin/index.vue`

**Interfaces:**
- Consumes: `isChurchWideManager`, `canManageMembersByRole`,
  `canAccessChurchAdmin`, `isPlatformAdmin`, `accentColor` — all already
  defined in this file, unchanged.
- Produces: nothing (this is the navigation leaf).

- [ ] **Step 1: Write the hub template**

Six rows, each `@click="router.push('/admin/<route>')"`, icon + title +
one-line description + chevron, styled with the `.member-card`/`.report-panel`
visual language already used elsewhere in the app (reuse existing classes,
don't invent new ones — see the approved mockup for exact copy):

```html
<div class="hub-list">
  <v-card
    v-for="item in adminHubItems"
    :key="item.route"
    class="member-card rounded-xl pa-4 elevation-1 bg-white border-subtle"
    role="button"
    tabindex="0"
    :aria-label="`Abrir ${item.title}`"
    @click="router.push(item.route)"
    @keydown.enter="router.push(item.route)"
    @keydown.space.prevent="router.push(item.route)"
  >
    <v-avatar :color="item.avatarBg" size="44" class="member-avatar">
      <component :is="item.icon" size="20" :color="item.iconColor" />
    </v-avatar>
    <div class="member-copy">
      <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0">{{ item.title }}</h3>
      <p class="text-caption text-grey-darken-1 mb-0">{{ item.description }}</p>
    </div>
  </v-card>
</div>
```

- [ ] **Step 2: Write the hub data**

```ts
import { BarChart3, Users, Music, Newspaper, MessageSquare, Settings2 } from "lucide-vue-next";

const adminHubItems = computed(() => [
  { route: "/admin/relatorios", title: "Relatórios", description: "Confirmações, presença de culto, liderança", icon: BarChart3, avatarBg: "orange-lighten-4", iconColor: "#B5472A" },
  { route: "/admin/pessoas", title: "Pessoas", description: "Membros, cargos e rol de visitantes", icon: Users, avatarBg: "blue-lighten-4", iconColor: "#2563eb" },
  { route: "/admin/ministerios", title: "Gestão de ministérios", description: "Escalas, repertório, líderes", icon: Music, avatarBg: "purple-lighten-4", iconColor: "#7c3aed" },
  { route: "/admin/publicacoes", title: "Publicações", description: "Avisos, devocionais, versículo do dia", icon: Newspaper, avatarBg: "teal-lighten-4", iconColor: "#0f766e" },
  { route: "/admin/mensagens", title: "Mensagens", description: "WhatsApp: modelos, envios, aniversariantes", icon: MessageSquare, avatarBg: "orange-lighten-4", iconColor: "#B5472A" },
  { route: "/admin/configuracoes", title: "Configurações", description: "Perfil, horários, WhatsApp, plano", icon: Settings2, avatarBg: "grey-lighten-3", iconColor: "#475569" },
]);
```

(`lucide-vue-next` icon names and hex colors above match the approved mockup
artifact from brainstorming — adjust only if a name doesn't exist in the
installed `lucide-vue-next` version; verify with
`grep -n "BarChart3\|Newspaper\|Settings2" web/app/pages/admin/index.vue`
since some of these are likely already imported for other purposes in this
file.)

- [ ] **Step 3: Delete now-dead code**

Remove the old `v-tabs`/`v-window` shell for the church-admin view, the
`activeAdminTab` ref, and any tab-label computed that's now unused (confirm
each with `grep -n "<identifier>"` before deleting, same discipline as every
prior task).

- [ ] **Step 4: Build check** — `npm run web:build`, expect success.

- [ ] **Step 5: Manual verification**

`/admin` shows the 6-row hub, matching the approved mockup. Tap each row,
confirm it navigates to the right route and that route's content still works
(spot-check one action per group — this is a final integration pass, not a
full re-test of every group already verified in its own task).

- [ ] **Step 6: Commit**

```bash
git add web/app/pages/admin/index.vue
git commit -m "feat(web): replace admin tab bar with 6-row navigation hub"
```

---

### Task 9: Split the platform-admin (SUPER_ADMIN) view into its own route

**Files:**
- Create: `web/app/pages/platform-admin.vue`
- Modify: `web/app/pages/admin/index.vue` — remove the platform-admin shell
  entirely
- Modify: `web/app/components/layouts/bottomNavigation/index.vue`

**Interfaces:**
- Consumes: `useAdmin()` → `{ getChurches, getChurchById,
  updateChurchUserByAdmin, resetChurchUserPasswordByAdmin,
  removeChurchUserByAdmin, deleteChurch }` (unchanged); `useHelpVideos()` (for
  the "Vídeos de Ajuda" tab — confirm exact import name via
  `grep -n "useHelpVideos\|HelpVideo" web/app/pages/admin/index.vue`).
- Produces: nothing.

- [ ] **Step 1: Find the platform-admin shell**

```bash
grep -n "isPlatformAdmin\|activeAdminMode\|activePlatformTab" web/app/pages/admin/index.vue
```

This is the block from the top of the (original) file: the Admin
Master/Administração da Igreja toggle, the `platform-admin-page` section with
its own `Geral`/`Igrejas Cadastradas`/`Vídeos de Ajuda` tabs.

- [ ] **Step 2: Create `web/app/pages/platform-admin.vue`**

Move the entire platform-admin block here, keeping its internal 3-tab
structure as-is (it's small — no further grouping needed, this isn't part of
the 6-group redesign, just relocated). No back button needed at the top
level (it's reached from the bottom nav directly), but each of its 3 internal
tabs stays as `v-tabs`, unchanged.

- [ ] **Step 3: Add the dual-role switch**

For a user who is both `isPlatformAdmin` **and** `canAccessChurchAdmin` (the
`admin-mode-shell` toggle in the original code covers exactly this case),
replace the toggle with a small link in each page's app-bar area: on
`/platform-admin`, a text button "Ir para administração da igreja" →
`router.push('/admin')`; on `/admin`, when `isPlatformAdmin` is also true, a
text button "Ir para admin master" → `router.push('/platform-admin')`. Both
buttons are `v-if="isPlatformAdmin && canAccessChurchAdmin"` (the same
condition the original toggle used).

- [ ] **Step 4: Update the bottom nav routing condition**

In `bottomNavigation/index.vue`, the "Admin" button currently does
`router.push('/admin')` unconditionally when `showAdmin` is true. Change it
so a platform admin **without** `canAccessChurchAdmin` (no church of their
own) routes to `/platform-admin` instead of `/admin` — `/admin` would show
them nothing useful otherwise. Exact condition:
`isPlatformAdmin && !canAccessChurchAdmin` (this logic currently lives in
`admin/index.vue`'s computeds; the bottom-nav component will need its own
minimal version — check whether `user.value?.hasChurch` alone is a cheap
enough proxy, since `bottomNavigation/index.vue` doesn't currently have
`canAccessChurchAdmin`'s full permission-check logic, and pulling that whole
computed in is out of scope here; `hasChurch` is what the component already
reads for the `Conteúdo`/`Ministérios` `v-if`s, so it's the consistent choice).

- [ ] **Step 5: Remove the platform-admin block from `admin/index.vue`.**

- [ ] **Step 6: Build check** — `npm run web:build`, expect success.

- [ ] **Step 7: Manual verification**

Two accounts needed: `pastor-demo` (church-only — confirm nothing changed,
bottom nav "Admin" still opens the new hub) and a SUPER_ADMIN/ADMIN test
account if one exists in the seed data (confirm bottom nav "Admin" opens
`/platform-admin`, all 3 tabs load, and if that account also has a church,
the "Ir para administração da igreja" link works both directions).

- [ ] **Step 8: Commit**

```bash
git add web/app/pages/platform-admin.vue web/app/pages/admin/index.vue web/app/components/layouts/bottomNavigation/index.vue
git commit -m "refactor(web): split platform-admin view into its own /platform-admin route"
```

---

### Task 10: Fix the `?tab=` deep-link in the birthday scheduler

Small, unrelated-looking fix that falls directly out of this redesign: the
push notification sent by `birthdayScheduler.ts` links to
`/admin?tab=mensagens`, a query param `admin.vue` never actually read (a
latent bug shipped with Task 8, harmless until now because it just landed on
the tab bar's default tab). The new routes make the correct link trivial.

**Files:**
- Modify: `api/src/infrastructure/whatsapp/birthdayScheduler.ts`
- Modify: `api/tests/birthdayScheduler.test.ts`

- [ ] **Step 1: Update the notification URL**

In `birthdayScheduler.ts`, change:
```ts
url: "/admin?tab=mensagens",
```
to:
```ts
url: "/admin/mensagens",
```

- [ ] **Step 2: Update the test expectation**

In `birthdayScheduler.test.ts`, the test `"notifies pastors when someone's
birthday matches today (month/day only)"` asserts
`expect(mockSendToUsers).toHaveBeenCalledWith(["pastor-1"], { ... url:
"/admin?tab=mensagens", ... })` — update that string to `"/admin/mensagens"`.

- [ ] **Step 3: Run the test**

Run: `cd api && npx jest tests/birthdayScheduler.test.ts`
Expected: PASS (1 test's expected `url` value updated, rest unaffected).

- [ ] **Step 4: Commit**

```bash
git add api/src/infrastructure/whatsapp/birthdayScheduler.ts api/tests/birthdayScheduler.test.ts
git commit -m "fix(api): point birthday notification link at the new /admin/mensagens route"
```

---

### Task 11: Full-app verification pass

**Files:** None (verification only).

- [ ] **Step 1: Full test suite**

Run: `npm run validate` (from repo root)
Expected: lint + typecheck + all API tests + web build all pass — same bar as
every other task this session (Task 4 and Task 8 both ended here at
53/53 suites, 512/512 tests; this task changes zero backend files except
Task 10's one-line fix, so the count should be unchanged or +0/-0 on test
count from Task 10's edit).

- [ ] **Step 2: Rebuild and do one continuous click-through**

```bash
docker compose up -d --build web
```

Log in as `pastor-demo`. Starting from `/admin`, visit all 6 hub rows in
order, confirm each loads, confirm the back button on each returns to
`/admin`. Confirm the bottom nav's "Ministérios" and "Conteúdo" still open
the member-facing screens (unchanged, out of scope) and are visually/
functionally distinct from `/admin/ministerios` and `/admin/publicacoes`.

- [ ] **Step 3: Screenshot for the user**

Take a screenshot of the new `/admin` hub (same framing as the mockup sent
during brainstorming) and send it — this is what the user explicitly asked
for ("me mande print de como ficou").

- [ ] **Step 4: Final commit (if anything was fixed during this pass)**

Only if Step 1 or Step 2 surfaced a regression and it was fixed — otherwise
no commit needed, this task is verification-only.
