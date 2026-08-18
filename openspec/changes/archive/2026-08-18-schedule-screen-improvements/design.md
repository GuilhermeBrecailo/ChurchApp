## Context

`scale.vue` today renders three big surfaces from one file: the schedule list (`ScaleScheduleSection`), a details bottom sheet (stats/response/team/rehearsal/songs/resources), and a create/edit dialog (title/date/ministério/rehearsal/songs/resources/voluntários). The volunteer sub-section of the create/edit dialog reads:

```
<div v-if="memberOptions.length" class="mb-4">
  <p>Voluntários</p>
  ...
</div>
```

`memberOptions` comes from `useMembers().getMembers()` — a church-wide list, unrelated to which ministry is selected. There is no check against `scheduleForm.departmentId`.

## Goals / Non-Goals

**Goals:**
- Volunteer-adding UI only becomes usable after a ministério is chosen, so `scheduleFormAssignmentRoleOptions` is always correct when a leader starts adding people.
- Reduce the create/edit dialog and the details sheet to a scannable size, deferring less-common content (song lyrics/chords reader, resource list) to secondary views reachable by a button, per the pattern established in `ui-consistency-polish`.
- Remove confirmed-dead code (`NewScaleModal.vue`).

**Non-Goals:**
- Changing the assignment data model or API contracts (`useDepartments.ts`'s `createChurchSchedule`/`updateScheduleAssignments` stay as-is).
- Redesigning the song transposer/reader itself (covered by `music-screen-improvements` where it's reused).

## Decisions

- **Gate, don't hide, the Voluntários section**: keep it visible but disabled with a one-line hint ("Selecione um ministério para adicionar voluntários") when `scheduleForm.departmentId` is empty, rather than hiding it outright — so the field order (already Título → Data/Horário → Ministério → ... → Voluntários) reads as "not yet available" instead of appearing/disappearing, which is less jarring during editing (where `departmentId` is already set from the start).
  - Alternative considered: hide the section entirely until `departmentId` is set. Rejected — causes layout jump right as the user is mid-scroll through the form, worse for the "editing an existing schedule" case where it should just always be visible and enabled.
- **Extract sub-components** from `scale.vue`: `ScheduleFormDialog.vue` (create/edit), `ScheduleAssignmentsDialog.vue`, `ScheduleDetailsSheet.vue`, reusing the existing `Scale/ScheduleCard.vue` and `Scale/ScheduleSection.vue`. Parent `scale.vue` keeps data-fetching/state orchestration, children are presentational + emit events, matching the existing `@add-volunteer`/`@edit`/`@delete` event pattern already used for `ScaleScheduleSection`.
  - Why: a 3100-line single-file component is the direct cause of the density complaint ("deixar menos coisas em cada tela") — it's not just visual, the file itself has no separation between list/dialog/sheet concerns, making every future change riskier and harder to review.
- **Move song reader out of the details sheet inline flow into the existing fullscreen view** (`isSongFullscreenOpen`) by default instead of showing an inline `MusicSongTextRenderer` inside the sheet — the sheet keeps the song list (title/artist/key/bpm), tapping a song opens the reader (fullscreen already exists and works, just needs to become the default entry point instead of an optional expand).
- **Remove `NewScaleModal.vue`** outright — zero references found (`grep -rn "NewScaleModal" app` returns nothing); it duplicates `scale.vue`'s dialog with a hardcoded, stale ministry list.

## Risks / Trade-offs

- [Extraction touches a large, currently-working file] → Do it incrementally: extract one dialog at a time behind the same events/props contract, run `npm run web:build` after each extraction (no `web:test` exists per `CLAUDE.md`, so build + manual smoke test is the available safety net).
- [Gating Voluntários on `departmentId` could surprise leaders who only manage one ministry] → For single-department leaders, default `scheduleForm.departmentId` to their one manageable department on dialog open (see `departmentOptions`/`manageableDepartments`), so the section is enabled immediately in the common case.

## Open Questions

- Should removing `NewScaleModal.vue` also remove any now-orphaned styles/imports in `Ministery/` — confirm during implementation with a repo-wide search, not just the direct import.
