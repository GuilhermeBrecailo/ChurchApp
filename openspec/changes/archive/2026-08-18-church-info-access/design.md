## Context

`useAuth.ts`'s `AuthChurch` interface already carries `id, name, city, road, number, localZipCode, state, complement, document, logo, isActive, userMainId, slug, accentColor` — populated via `fetchMe()` from `GET /api/me` into `user.value.activeChurch`/`user.value.church`. This is already loaded for every authenticated session regardless of role, so a read-only display needs no new fetch for the core fields. Recurring service times were added as part of `church-landing-page` ("Pastor cadastra horários recorrentes de culto... exibidos tanto na landing pública quanto no dashboard interno") — need to confirm during implementation whether that data rides along on `/api/me` or needs its own lightweight fetch (likely the latter, via whatever endpoint the landing page itself already calls for `/c/:slug`).

`admin.vue`'s `publicLandingUrl` computed property is fully correct (origin + `/c/${slug}`) and simply orphaned — not wired into the template anywhere.

## Goals / Non-Goals

**Goals:**
- Any authenticated member can see their church's basic info without needing manage permissions.
- The already-correct public-page URL becomes an actual clickable button in at least two places (admin editing screen, member settings).

**Non-Goals:**
- Changing who can *edit* church data — that stays gated to `canManageMembersByRole` in `admin.vue`, unchanged.
- Building new backend endpoints for church info — reuse `/api/me`'s existing payload, and whatever endpoint `church-landing-page`'s public page already uses for service times if that data isn't already on `AuthChurch`.

## Decisions

- **Add the "Ver página pública" button next to the slug field in `admin.vue`'s existing "Geral" section**, using `publicLandingUrl` directly (`:href`, `target="_blank"`) — zero new state, the value already exists and is already correctly derived.
- **Add a "Dados da Igreja" entry point in `settings.vue`**, opened via `UtilsResponsiveOverlay` (per the `ui-consistency-polish` convention) rather than a new route, showing the same fields read-only: logo, name, address (assembled from `city`/`road`/`number`/`complement`/`state`/`localZipCode`), and service times. Includes the same "Ver página pública" link.
  - Alternative considered: a new dedicated route (`/church-info`). Rejected — `settings.vue` is already the one screen every role reaches for "things about my account/church," and a bottom-sheet keeps this consistent with the rest of the app's secondary-content pattern instead of adding a new top-level route for a read-only view.
- **Service times**: if not already present on `AuthChurch`, add a small `getChurchServiceTimes()`-style call in `useChurch.ts`/`useDepartments.ts` (whichever composable already backs `church-landing-page`'s recurring-service data) reused here read-only — avoid duplicating that data model.

## Risks / Trade-offs

- [Regular members seeing a "Ver página pública" link that opens a page showing the same info they just saw, redundantly] → Intentional: the in-app view is for the member themselves; the public link is specifically so they can *share* it with someone who isn't a member yet (a visitor). Different audience, same underlying data — not true redundancy.
- [If service-time data turns out not to be reusable without a new endpoint] → Ship the rest of this change (address/logo/name + public link) first; service times can follow as a fast-follow task if the data isn't already fetchable.

## Open Questions

- Confirm during implementation which composable/endpoint `church-landing-page`'s `/c/[slug].vue` uses for recurring service times, to reuse rather than duplicate.
