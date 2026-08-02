## 1. Prerequisites

- [ ] 1.1 Confirm `music-screen-improvements`'s `MusicSongCard`/`MusicSongViewer` are merged
- [ ] 1.2 Confirm `ministry-resources-pdf-upload`'s resource-dialog PDF support is merged

## 2. Tab extraction

- [ ] 2.1 Extract `MinisteryOverviewTab.vue`
- [ ] 2.2 Extract `MinisteryLeaderTab.vue` (largest tab, ~295 lines, including its delegation dialogs)
- [ ] 2.3 Extract `MinisteryTasksTab.vue` with its dialogs
- [ ] 2.4 Extract `MinisteryClassesTab.vue` with its dialogs
- [ ] 2.5 Extract `MinisteryResourcesTab.vue`, using the shared PDF-capable resource dialog
- [ ] 2.6 Extract `MinisteryMusicTab.vue`, using `MusicSongCard`/`MusicSongViewer`
- [ ] 2.7 Rewire `ministery/[id].vue` as a thin orchestrator: tab bar + `<component :is>` (or explicit v-if) for each extracted tab, passing `departmentId`/`department`
- [ ] 2.8 Run `npm run web:build` after each extraction step

## 3. Escalas tab → summary + link

- [ ] 3.1 Build a compact upcoming-schedules summary for the "Escalas" tab (next 2-3 schedules, pending-response counts)
- [ ] 3.2 Add "Ver todas as escalas" button navigating to `/scale` pre-filtered to this ministry
- [ ] 3.3 Remove the duplicate full create/edit schedule form from the ministry page, if one exists distinct from `/scale`'s

## 4. Verification

- [ ] 4.1 Manual smoke test: every tab renders and its dialogs (create/edit/view) work post-extraction
- [ ] 4.2 Manual smoke test: Escalas tab summary + link-to-`/scale` flow works and correctly pre-filters
- [ ] 4.3 Manual smoke test: Músicas and Recursos tabs behave identically to the shared components used elsewhere
- [ ] 4.4 Run `npm run web:build` and `npm run api:typecheck` (no backend changes expected, but confirm)
