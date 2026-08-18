## Why

`web/app/pages/scale.vue` is a single 3100+ line file handling schedule (escala) listing, creation/edit, volunteer assignment, song reading/transposing, and resource links all in one place. In the "Nova/Editar escala" dialog, the "Voluntários" section (`v-if="memberOptions.length"`) is visible and usable as soon as the church has any members at all — it is not gated on the "Ministério" field (`scheduleForm.departmentId`) being filled in first. Role suggestions for a volunteer (`scheduleFormAssignmentRoleOptions`) come from `departmentRoleOptions[dept.type]`, which falls back to a generic `["Voluntário"]` list until a department is chosen — so a leader who adds volunteers before picking the ministry gets a role list that doesn't reflect the ministry they're actually scheduling for. Separately, there's a dead, unused component (`web/app/components/Ministery/NewScaleModal.vue`, no references anywhere in the app) with a hardcoded ministry list and no save logic — leftover from an earlier version of this same flow.

## What Changes

- Gate the "Voluntários" section of the schedule create/edit dialog behind having selected a "Ministério" first — disabled/hidden with an explanatory hint until `scheduleForm.departmentId` is set, so role suggestions are always ministry-correct by the time a leader adds a volunteer.
- Remove the dead `NewScaleModal.vue` component (superseded by the dialog already in `scale.vue`).
- Reduce visual/informational density of the schedule list and detail sheet — apply the shared "fewer things per screen, push secondary stuff to its own view" pattern from `ui-consistency-polish` specifically to `scale.vue`'s create dialog (currently one long form: title, date/time, ministério, rehearsal date/time, rehearsal notes, songs, resources, volunteers — all in a single scroll) and to the details bottom sheet (stats, response actions, team, rehearsal, songs with inline reader/transposer, resources — also all in one scroll).
- Split the monolithic `scale.vue` into smaller components (list/section, create-edit dialog, assignments dialog, details sheet, song reader) so each concern is independently maintainable and easier to keep consistent with the loading/back-button rules from `ui-consistency-polish`.

## Capabilities

### New Capabilities
- none (behavioral refinement of an existing, already-shipped capability)

### Modified Capabilities
- `schedule-management`: schedule creation flow requires ministry selection before volunteer assignment becomes available (no existing spec file in `openspec/specs/` yet for this capability — treated as the first formal spec despite the feature having shipped under earlier changes; see `openspec/changes/decline-reason-input` and `openspec/changes/unavailable-dates` for prior related work that never synced specs either).

## Impact

- `web/app/pages/scale.vue` — dialog field ordering/gating, component decomposition.
- `web/app/components/Scale/` — likely destination for extracted sub-components.
- `web/app/components/Ministery/NewScaleModal.vue` — removed.
- No backend changes required; `scheduleForm.departmentId` and `assignmentRoleOptions` already exist and already drive role suggestions correctly once populated.
