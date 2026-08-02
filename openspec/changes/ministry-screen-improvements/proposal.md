## Why

`web/app/pages/ministery/[id].vue` is 4366 lines in one file. Its 7 tabs (Visão geral, Líder, Escalas, Tarefas, Recursos, Músicas, Aulas) account for roughly 1060 lines of template (lines 70–1130); the remaining ~3230 lines are entirely modal dialogs (resource, song with its own 3-tab info/lyrics/media form, song viewer with its own lyrics/chords/notes tabs, activity, and more) all living inline in the same file as the tab content they belong to. This is the same root cause behind `schedule-screen-improvements`' complaint about `scale.vue`, at larger scale, and it's the concrete target for "melhorar tela de ministério": one screen carrying seven distinct concerns (overview, leadership, scheduling, tasks, resources, repertoire, kids classes) with no separation, making it slow to navigate mentally and risky to change.

## What Changes

- Decompose `ministery/[id].vue`'s tab sections into their own components (`MinisteryOverviewTab.vue`, `MinisteryLeaderTab.vue`, `MinisteryTasksTab.vue`, `MinisteryClassesTab.vue`, etc.), each owning its own dialogs instead of all dialogs living in the parent file regardless of which tab they belong to.
- Reuse the shared `MusicSongCard`/`MusicSongViewer` components from `music-screen-improvements` for the "Músicas" tab instead of ministry-local song markup, and the PDF-upload pattern from `ministry-resources-pdf-upload` for "Recursos" — this change should not reimplement either.
- Evaluate whether the "Escalas" tab (a per-ministry schedule view, ~121 lines) should stay inline or become a filtered link into the existing `/scale` page (already the canonical schedule screen per `schedule-screen-improvements`) to avoid maintaining two schedule UIs.
- Apply the `ui-consistency-polish` conventions (back control — already present here; loading states — already present; shared overlay for expansion) as the decomposition happens, since splitting the file is the natural point to also fix any local inconsistency.

## Capabilities

### New Capabilities
- none

### Modified Capabilities
- `ministry-resources` (from `ministry-resources-pdf-upload`): resources tab implementation moves into its own component as part of this decomposition — no requirement-level change, sequencing note only.

## Impact

- `web/app/pages/ministery/[id].vue` — split into a thin orchestrator + tab components.
- New components likely under `web/app/components/Ministery/`.
- Coordinates with `schedule-screen-improvements` (possible Escalas-tab-to-link change), `music-screen-improvements` (shared song components), and `ministry-resources-pdf-upload` (shared resource dialog with PDF upload) — this change should land after those three so it can consume their finished components rather than duplicating work mid-flight.
- No backend/API changes.
