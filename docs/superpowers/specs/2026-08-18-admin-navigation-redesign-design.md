# Admin Navigation Redesign (Task 11)

## Why

`web/app/pages/admin.vue` is 9506 lines and growing — it is the single file behind
every pastor-facing administrative feature in ChurchApp: church profile, members,
ministries, content moderation, reports, roles, the visitor/member roster, and the
WhatsApp messaging suite (templates, automatic rules, history, birthday
notifications). All of it lives behind one horizontal `v-tabs` bar with 9 items
(Plano, Geral, Membros, Ministérios, Conteúdo, Relatórios, Cargos, Rol, Mensagens),
plus a separate SUPER_ADMIN-only view (Geral / Igrejas Cadastradas / Vídeos de Ajuda)
gated inside the same file.

Two concrete problems fall out of this:

1. **Navigation.** Nine tabs don't fit a phone screen — the bar scrolls
   horizontally and pastors have described the app as "bagunçado e desorganizado."
   Two of the tab names (**Ministérios**, **Conteúdo**) collide with unrelated
   top-level bottom-nav destinations that show a different, member-facing screen —
   the same word means two different things depending on where you tap it.
2. **Maintainability.** A single 9506-line `.vue` file makes every change here
   riskier and slower to review, and is itself a symptom of nothing having a clear
   home.

This spec covers **Admin only** (explicitly scoped down from "redesign the whole
frontend" per user decision — the member-facing screens, `Início`/`Conteúdo`/
`Ministérios`/`Usuário`, are comparatively lean already and are out of scope here).

## Goals

- Replace the 9-tab bar with a small, scannable set of grouped destinations that
  fit a phone screen without horizontal scrolling.
- Eliminate the naming collisions with the bottom nav.
- Break `admin.vue` into one file per group, each independently reviewable.
- Give every admin sub-screen a consistent back button (today only some screens
  have one).
- Split the SUPER_ADMIN platform view into its own route, separate from a
  pastor's per-church admin.

## Non-goals

- No visual/color-token rework. `web/app/assets/css/theme.css` already defines a
  single accent source of truth (`--app-color-accent`, bridged into Vuetify's
  `purple-darken-3` color prop via the documented CSS bridge) — there is no
  color-system inconsistency to fix. Investigated and ruled out during
  brainstorming.
- No change to member-facing navigation (bottom nav items, `Início`/`Conteúdo`/
  `Ministérios`/`Usuário` pages) — explicitly deferred to a possible later phase.
- No new features. Every piece of functionality that exists today in `admin.vue`
  keeps working exactly as it does now; this is a reorganization, not a rewrite of
  behavior.
- No backend changes. Every composable (`useRoster`, `useMessages`, `useBirthdays`,
  `useAttendance`, `useMembers`, `useDepartments`, etc.) is already decoupled from
  `admin.vue` and needs no changes — only the Vue template/local-state code that
  currently lives inline in `admin.vue` moves.

## Approach (chosen: hub + grouped routes)

Two other approaches were considered and rejected during brainstorming:
- **Same grouping, no route change** (components swapped inside one shell page) —
  smaller diff, but does nothing for the 9506-line file problem and keeps
  `admin.vue` as the owner of everything.
- **Command palette (Cmd+K) on top of the current structure** — a desktop
  power-user pattern; overkill for 6 mobile destinations used mostly by pastors on
  their phones.

The chosen approach: `/admin` becomes an index screen listing 6 tappable rows;
each one navigates to its own route. Nuxt's file-based routing means each group
is naturally its own file, which is what breaks up the monolith.

## Information architecture

`web/app/pages/admin.vue` (a file) is replaced by `web/app/pages/admin/` (a
directory), file-based routes:

| Route | File | What moves in from today's `admin.vue` |
|---|---|---|
| `/admin` | `admin/index.vue` | New: the hub itself — 6 rows, icon + title + one-line description + chevron |
| `/admin/relatorios` | `admin/relatorios.vue` | "Relatórios" tab: pastoral KPI cards, Ministérios chart, Liderança panel, **Público do culto** (Task 4), and the Pro-gated `AdminReports` component (Confirmação/Presença de escala/Membros) |
| `/admin/pessoas` | `admin/pessoas.vue` | "Membros" + "Cargos" + "Rol" tabs, combined as a segmented control (same visual pattern already used well by the Mensagens sub-tabs) |
| `/admin/ministerios` | `admin/ministerios.vue` | "Ministérios" tab (admin-side ministry management — create/edit ministries, assign leaders). **Renamed in the UI** to "Gestão de ministérios" to stop colliding with the bottom-nav "Ministérios" (member-facing browse/participate view) |
| `/admin/publicacoes` | `admin/publicacoes.vue` | "Conteúdo" tab (editorial: avisos, devocionais, versículo do dia, posts). **Renamed in the UI** to "Publicações" to stop colliding with the bottom-nav "Conteúdo" (member-facing reading view) |
| `/admin/mensagens` | `admin/mensagens.vue` | "Mensagens" tab as-is — Modelos / Enviar agora / Regras automáticas / Histórico / Aniversariantes. Already well-organized internally; only the URL changes |
| `/admin/configuracoes` | `admin/configuracoes.vue` | "Geral" tab (church profile/logo/appearance, Código de Convite, WhatsApp connect, horários de culto) + "Plano" tab (billing) |

The SUPER_ADMIN platform view (today's "Geral" / "Igrejas Cadastradas" / "Vídeos
de Ajuda", a different persona managing every church rather than one pastor
managing their own) moves to its own top-level route, e.g. `/platform-admin`,
reachable from the same bottom-nav "Admin" button when the signed-in user is a
platform admin without an active church context — exact routing condition to be
confirmed against the current `showAdmin`/role logic in
`components/layouts/bottomNavigation/index.vue` during planning.

Every sub-page (`/admin/*`) gets a back button in its app-bar area, using the
existing back-button pattern (`router.back()` + `ChevronLeft`, already used in
`content/bible.vue`, `content/playlist.vue`, `ministery/[id].vue`) — applied
consistently here, closing the same gap the archived `ui-consistency-polish`
proposal had flagged for other screens.

## Visual treatment

No token changes (see Non-goals). What *does* change, visually:
- The 9-tab horizontal bar is gone; replaced by the hub's row list (mockup
  approved by user — see artifact published during brainstorming).
- Within a group, sub-navigation uses the segmented-control pattern already
  proven in the Mensagens tab (`messagesSubTabs`), reused rather than reinvented,
  for `/admin/pessoas` (Membros/Cargos/Rol).
- Card styling for hub rows and grouped lists reuses the existing
  `.member-card` / `.report-panel` visual language already established elsewhere
  in `admin.vue` — no new card pattern introduced.
- Back button uses the existing icon-button pattern already in the codebase.

## Migration approach

Incremental, one group at a time — not a single giant diff:

1. Create `web/app/pages/admin/` directory structure with the 7 files above,
   starting with `index.vue` (the hub) and `configuracoes.vue` (smallest, most
   self-contained group).
2. For each subsequent group, cut its template/script/style out of `admin.vue`
   into its new file, keeping composable usage identical (no composable changes
   needed).
3. After each group's move, verify via `npm run web:build` (must stay clean) and
   a live click-through in the browser as `pastor-demo` (same verification
   pattern already used for Task 4 and Task 8) — confirm the moved screen still
   works before moving to the next group.
4. Delete the old `admin.vue` tab markup for that group once its new page is
   verified working, keeping `admin.vue` (shrinking) as the source of truth for
   groups not yet migrated, until the last group moves and the old file is
   deleted entirely.
5. Update every internal link that currently points at `/admin?tab=xxx` (query
   param) to the new path-based routes — e.g. `birthdayScheduler.ts`'s push
   notification `url: "/admin?tab=mensagens"` becomes `url: "/admin/mensagens"`.
   Note: the old `?tab=` query param was never actually read by `admin.vue` to
   auto-select a tab — this was a latent bug in the just-shipped Task 8; the new
   routes fix it for free.

## Testing / verification

No frontend test runner exists for `web/` (confirmed in `CLAUDE.md`). Verification
is:
- `npm run web:build` clean after each group's migration.
- `npm run api:lint && npm run api:typecheck` unaffected (no backend changes) —
  run once at the end as a sanity check.
- Manual click-through per group as `pastor-demo`, covering every action that
  exists today in that tab (the plan created after this spec should enumerate
  these per group, since that's where regressions would actually be caught).
- Confirm no page other than the ones being migrated regressed — the roster/
  messages/birthday/attendance panels built in the last two sessions are the
  highest-risk areas since they're newest and least battle-tested.

## Open questions for the plan phase

- Exact role condition for routing platform admins vs. church pastors from the
  same bottom-nav "Admin" button (needs reading `showAdmin`/`isPlatformAdmin`
  logic in `bottomNavigation/index.vue` and how `admin.vue` currently branches on
  it).
- Whether `/admin/pessoas`'s three sub-sections should each keep their own URL
  segment (`/admin/pessoas?tab=cargos`) for deep-linking, matching how
  `/admin/mensagens` will likely want the same for its 5 sub-tabs.
