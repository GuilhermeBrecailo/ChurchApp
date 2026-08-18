## Context

Confirmed section boundaries in `ministery/[id].vue`:

| Tab | Template lines | Approx size |
|---|---|---|
| Visão geral | 70–93 | ~23 |
| Líder | 93–388 | ~295 |
| Escalas | 388–509 | ~121 |
| Tarefas | 509–590 | ~81 |
| Recursos | 590–676 | ~86 |
| Músicas | 676–876 | ~200 |
| Aulas | 876–~1130 | ~250 |
| *(all dialogs)* | ~1135–4366 | ~3230 |

The tab content itself is a manageable ~1060 lines total; the file's size comes almost entirely from every tab's dialogs (create/edit forms, viewers) sitting in the same file regardless of which tab owns them. This mirrors `scale.vue`'s problem (`schedule-screen-improvements`) but is roughly 40% larger.

## Goals / Non-Goals

**Goals:**
- Each tab's markup, dialogs, and the state/handlers they need live together in one component, not scattered across a 4366-line parent.
- The "Músicas" and "Recursos" tabs consume the shared components being built in `music-screen-improvements` and `ministry-resources-pdf-upload` rather than keeping local duplicates.
- Reduce duplicate schedule UI if the "Escalas" tab and `/scale` page turn out to be redundant.

**Non-Goals:**
- Changing the set of tabs or what each tab does functionally (this is a structure/maintainability change, not a feature change to ministry management itself).
- Rebuilding the leader-delegation logic (the largest single tab at ~295 lines) — extract as-is into its own component, revisit its own internal density separately if needed.

## Decisions

- **One component per tab**, each taking `departmentId`/`department` as props and owning its own local dialog state — matching the extraction pattern already decided in `schedule-screen-improvements` for `scale.vue`, for consistency between the two biggest files in the app.
  - Alternative considered: keep tabs inline but extract only dialogs. Rejected — the tabs and their dialogs are tightly coupled (a dialog's form state belongs to its tab's data), splitting them apart would just move the coupling problem rather than resolve it.
- **"Escalas" tab**: default to keeping it as a compact read-only summary (upcoming schedules for this ministry) with a "Ver todas as escalas" button that navigates to `/scale` pre-filtered to this ministry (the filter chips already exist in `scale.vue`), rather than a full duplicate CRUD surface — full create/edit stays exclusively in `/scale` (the canonical schedule screen). This directly applies the "one button that goes to that screen" principle from `ui-consistency-polish`.
  - Alternative considered: keep full CRUD in both places. Rejected — two places to create/edit the same schedule data is a duplication and consistency risk, not a feature.
- **Sequencing**: this change explicitly depends on `music-screen-improvements` and `ministry-resources-pdf-upload` landing first, so their tab components can be built directly against the finished shared song/resource components instead of extracting local versions now and refactoring again later.

## Risks / Trade-offs

- [Extraction touches the largest file in the app] → Extract one tab at a time, `npm run web:build` after each, same incremental approach as `schedule-screen-improvements`.
- [Turning "Escalas" into a summary+link changes an existing workflow leaders may rely on] → Confirm the summary shows enough (next 2-3 schedules, pending-response counts) that it's not a net loss of information at a glance, just a move of the *editing* surface to `/scale`.

## Open Questions

- Should "Tarefas" (tasks) and "Aulas" (kids classes) tabs also become their own routes (`/ministery/[id]/tasks`, etc.) instead of tabs, given the app-wide "menos coisas por tela" direction? Default to keeping them as tabs within this change (structural extraction only) and revisit as a follow-up if the extracted components are still too dense on their own.
