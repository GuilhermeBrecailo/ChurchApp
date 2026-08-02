## Why

An audit of `web/app/pages/*.vue` shows the app already has the right building blocks — a back-button header pattern (`router.back()` + `ChevronLeft`, used in `content/bible.vue`, `content/playlist.vue`, `ministery/[id].vue`), a `UtilsResponsiveOverlay` component that renders as a bottom sheet on mobile and a dialog/fullscreen on desktop (already used across `scale.vue` and `ministery/[id].vue`), and a `v-skeleton-loader` loading convention (used in most pages) — but they're applied inconsistently:
- `register.vue`, `onboarding/church.vue`, and `forgot-password.vue` all use the `not-app-bottom` layout (i.e. they're secondary flow screens, not bottom-nav tab destinations) yet none of them has a back/close control.
- Within the same `content/` section, `bible.vue` and `playlist.vue` have a back button but `devotionals.vue`, `verse.vue`, and `content/index.vue` don't.
- `forgot-password.vue`, `content/index.vue`, and the public `c/[slug].vue` landing page render with no loading indicator at all, while nearly every other page uses `v-skeleton-loader`.
- Expandable content is handled two different ways in the same file (`ministery/[id].vue` uses a native `<details>` element for the song-preference panel alongside `UtilsResponsiveOverlay` bottom sheets for dialogs elsewhere).
- Several screens (the schedule create/edit dialog, the ministry repertoire tab before `music-screen-improvements`) pack many concerns into one continuous scroll instead of a primary action plus a button to a dedicated screen.

## What Changes

- Establish and document (in `CLAUDE.md`'s Frontend section) three baseline rules for every screen/component going forward: (1) every non-tab-root screen has a back or close control, (2) every screen that fetches data shows a loading state (skeleton or spinner) before content, never a blank flash, (3) expandable secondary content uses `UtilsResponsiveOverlay`, not ad-hoc `<details>`/inline `v-if` toggles.
- Audit and fix the concrete gaps found: add back/close controls to `register.vue`, `onboarding/church.vue`, `forgot-password.vue`, `content/devotionals.vue`, `content/verse.vue`, `content/index.vue`; add loading states to `forgot-password.vue`, `content/index.vue`, `c/[slug].vue`.
- Replace the native `<details>` song-preference panel in `ministery/[id].vue` with `UtilsResponsiveOverlay`.
- Apply the "one button that navigates to a dedicated screen" pattern where a screen currently shows a secondary concern inline: this is the shared principle behind `schedule-screen-improvements` (dialog decomposition) and `music-screen-improvements` (song detail moves out of the list card) — this change owns the principle and the shared component work; those two own applying it to their specific screens.

## Capabilities

### New Capabilities
- `screen-navigation-consistency`: baseline back/close, loading, and expansion-pattern rules applied app-wide.

### Modified Capabilities
- none

## Impact

- `web/app/pages/register.vue`, `onboarding/church.vue`, `forgot-password.vue`, `content/devotionals.vue`, `content/verse.vue`, `content/index.vue`, `c/[slug].vue` — add back/close and/or loading states.
- `web/app/pages/ministery/[id].vue` — replace `<details>` with `UtilsResponsiveOverlay`.
- `CLAUDE.md` — document the three baseline rules so future screens follow them by default.
- Coordinates with (does not duplicate) `schedule-screen-improvements` and `music-screen-improvements`, which apply the density/navigation principle to their specific screens.
