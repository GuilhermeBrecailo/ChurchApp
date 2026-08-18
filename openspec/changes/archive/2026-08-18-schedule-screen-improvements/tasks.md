## 1. Volunteer-after-ministry gating

- [ ] 1.1 Disable the "Voluntários" add controls in the schedule form when `scheduleForm.departmentId` is empty, with hint text
- [ ] 1.2 Pre-select `scheduleForm.departmentId` on dialog open when `manageableDepartments` has exactly one entry
- [ ] 1.3 Verify editing an existing schedule (department already set) shows Voluntários enabled immediately

## 2. Component decomposition

- [ ] 2.1 Extract `ScheduleFormDialog.vue` (create/edit) from `scale.vue` into `web/app/components/Scale/`
- [ ] 2.2 Extract `ScheduleAssignmentsDialog.vue` from `scale.vue`
- [ ] 2.3 Extract `ScheduleDetailsSheet.vue` from `scale.vue`, defaulting song taps to the existing fullscreen reader instead of inline expansion
- [ ] 2.4 Wire extracted components back into `scale.vue` via the existing event pattern (`@add-volunteer`, `@edit`, `@delete`, etc.)
- [ ] 2.5 Run `npm run web:build` after each extraction step to catch breakage early

## 3. Cleanup

- [ ] 3.1 Delete `web/app/components/Ministery/NewScaleModal.vue` and confirm no remaining references (`grep -rn "NewScaleModal" web/app`)

## 4. Verification

- [ ] 4.1 Manual smoke test: create a schedule as a multi-ministry leader — Voluntários stays disabled until Ministério is picked
- [ ] 4.2 Manual smoke test: create a schedule as a single-ministry leader — Ministério pre-filled, Voluntários enabled immediately
- [ ] 4.3 Manual smoke test: edit an existing schedule — Voluntários enabled from the start
- [ ] 4.4 Manual smoke test: full create/edit/assign/detail/song-view flow still works after decomposition
