## Context

Confirmed by auditing every file under `web/app/pages/`:

| Page | Layout | Has back/close | Has loading state |
|---|---|---|---|
| `register.vue` | `not-app-bottom` | No | yes |
| `onboarding/church.vue` | `not-app-bottom` | No | yes |
| `forgot-password.vue` | `not-app-bottom` | No | **No** |
| `content/bible.vue` | default | yes (`router.back()`) | yes |
| `content/playlist.vue` | default | yes (`router.back()`) | yes |
| `content/devotionals.vue` | default | No | yes |
| `content/verse.vue` | default | No | yes |
| `content/index.vue` | default | No | **No** |
| `ministery/[id].vue` | default | yes | yes |
| `c/[slug].vue` | `public` | No | **No** |

Pages on the `default` layout get a bottom nav bar (`app/components/layouts/bottomNavigation/`), so top-level tab destinations (`index.vue`, `scale.vue`, `admin.vue`, `notifications.vue`, `prayer.vue`, `settings.vue`, `user.vue`, `ministery/index.vue`) correctly have no back button — they're roots, not pushed screens. The gaps above are all screens reached *from* somewhere (a nav link, a "não tenho igreja" flow, a signup link) that give the user no way back except the browser's own back button.

`UtilsResponsiveOverlay` already exists and already implements exactly the "opens a bottom sheet on mobile, dialog/fullscreen on desktop" behavior item 12 of the original request asks for — it's not a new component to build, just a convention to apply consistently instead of one-off `<details>`/inline toggles.

## Goals / Non-Goals

**Goals:**
- Every screen the user can navigate *into* has an explicit way back that doesn't rely on the browser back button.
- Every screen that loads data shows a skeleton/spinner instead of a blank page during the fetch.
- One expansion pattern (`UtilsResponsiveOverlay`) for secondary content, not several.
- The three rules are written down in `CLAUDE.md` so new screens default to them instead of the reviewer having to catch omissions.

**Non-Goals:**
- Building a new overlay/sheet component — `UtilsResponsiveOverlay` already does the job.
- Auditing every dialog inside every page for loading states on their internal actions (buttons) — that's covered implicitly by the existing `:loading="isX"` convention already used almost everywhere; this change is about screen-level entry, not per-button state.

## Decisions

- **Reuse the exact header pattern from `bible.vue`**: `v-btn icon variant="text" @click="router.back()"` with `ChevronLeft` — apply verbatim to the six gap screens rather than inventing a new header component, for zero visual inconsistency with the pages that already do this right.
- **`forgot-password.vue`, `content/index.vue`, `c/[slug].vue` get `v-skeleton-loader` blocks** matching the shape of their content (form fields for `forgot-password.vue`, card grid for `content/index.vue`, hero/sections for `c/[slug].vue`), consistent with the pattern already in `bible.vue`.
- **Replace `<details>` in `ministery/[id].vue`'s song-viewer song-preference panel with `UtilsResponsiveOverlay`**, matching how every other secondary panel on that same page already opens (resource dialog, activity dialog, song dialog all already use `UtilsResponsiveOverlay`) — the `<details>` element is the one outlier on the page.
- **Document the three rules directly in the repo's `CLAUDE.md`** under a new short "Frontend screen conventions" note, since `CLAUDE.md` is what future work (including AI-assisted work) reads first — this is the cheapest way to make the rule sticky.

## Risks / Trade-offs

- [Public landing page (`c/[slug].vue`) back/close semantics are different from authenticated screens — there's nowhere authoritative to "go back" to for an anonymous visitor] → Public page only gets the loading-state fix in this change; a back control there isn't meaningful (it's an entry point, not a pushed screen) and is explicitly out of scope.
- [Adding back buttons to `register.vue`/`onboarding/church.vue` mid-flow could let users abandon a partially-filled form silently] → Back button just calls `router.back()` (same as browser back today); no new data-loss risk beyond what already exists via the browser's own back button.

## Open Questions

None — every screen in the gap list has a same-app sibling already doing this correctly to copy from.
