## Why

Two related gaps: (1) `admin.vue` already computes `publicLandingUrl` (`${origin}/c/${slug}`, built from the church's slug — the same public page shipped by `church-landing-page`, 51/52 tasks done) but that computed value is never referenced anywhere in the template — there is no "ver página pública" button anywhere in the app despite the URL already being derived. (2) The church's own basic data (address, service times, contact, logo) is only visible under Admin → "Geral" (`v-show="canManageMembersByRole && activeAdminTab === 'geral'"`) — gated to users who can manage members. A regular member (`MEMBRO` role, no manage permission) has no in-app screen showing their own church's basic information at all; they'd have to already know and visit the public `/c/:slug` page directly, which nothing in the authenticated app links to.

## What Changes

- Add a "Ver página pública" button (using the existing `publicLandingUrl` computed value) to the church admin "Geral" tab, opening `/c/:slug` in a new tab.
- Add a read-only "Dados da Igreja" view accessible to every member (not just managers) — name, address, logo, service times, contact — sourced from the same church data already available via `useAuth()`'s `user.activeChurch`/`user.church`, reachable from `settings.vue` (personal settings) since that's the one screen every authenticated role already has and expects to find "about my church"-type information.
- The read-only view for regular members also gets the "Ver página pública" button/link, so any member can share the church's public page with a visitor even if they can't edit church data themselves.

## Capabilities

### New Capabilities
- `church-info-visibility`: read-only in-app access to a church's basic info for any authenticated member, plus a link to the public landing page from both the admin editing screen and the member-facing read-only view.

### Modified Capabilities
- none

## Impact

- `web/app/pages/admin.vue` — add the "Ver página pública" button next to the existing (currently unused) `publicLandingUrl` computed value.
- `web/app/pages/settings.vue` — add a "Dados da Igreja" section/link for all roles.
- No backend changes — `AuthUser.activeChurch`/`church` (from `/api/me`) already carries the fields needed (`name`, `city`, `road`, `number`, `localZipCode`, `state`, `complement`, `logo`, `slug`); service times come from the same `schedules`/recurring-service data `church-landing-page` already surfaces publicly.
