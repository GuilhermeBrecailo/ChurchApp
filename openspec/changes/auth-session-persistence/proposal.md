## Why

Members report being sent back to `/login` every time they leave the web app and return. Tracing the flow: the access token lives only in an in-memory `useState` (expected to reset on a fresh load) and is meant to be silently restored via `POST /public/auth/refresh-token`, which reads an httpOnly `refresh_token` cookie. That cookie's `Max-Age` is set dynamically, per login, from whatever Keycloak returns as `refresh_expires_in` (`api/src/interfaces/adapters/authAdapters.ts`) — the code already forwards this correctly. The demo login path hardcodes `refresh_expires_in: 604800` (exactly 7 days) precisely because real Keycloak logins don't: that number comes straight from the realm/client's Keycloak session settings, which (per `CLAUDE.md`, "Keycloak realm/client (`clientA`) must be configured manually per README") are configured by hand and, evidently, are set well short of 7 days — likely close to Keycloak's own defaults (SSO Session Idle is commonly 30 minutes). So the moment a member is away longer than that, Keycloak invalidates the refresh token server-side and the next visit hits `/login`, independent of anything in the app's own code.

## What Changes

- Configure the `clientA` Keycloak client's session/token lifetimes (SSO Session Idle, SSO Session Max, or client-level overrides if the realm is shared with other consumers) so a refresh token actually stays valid for 7 days of inactivity, matching the demo login's already-correct 7-day behavior.
- Document the required Keycloak settings in the README's existing "Keycloak realm/client... must be configured manually" section, so this isn't silently lost on the next environment setup (local, staging, prod all configure Keycloak by hand today — no realm-export/config-as-code exists in the repo).
- Add a lightweight backend safeguard: log (not silently swallow) refresh-token failures with the Keycloak error reason, so "why did this user get logged out" is diagnosable instead of only visible as a generic redirect.
- Verify the cross-domain cookie behavior already implemented (`refreshCookieDomain`, `SameSite=None` in production per the existing code comments in `authAdapters.ts` and `auth.global.ts`) continues to work once the longer-lived cookie is in place — no changes expected there, just confirmation.

## Capabilities

### New Capabilities
- none

### Modified Capabilities
- `session-persistence`: refresh-token lifetime for real (non-demo) logins SHALL match the already-documented 7-day expectation (no existing spec file yet in `openspec/specs/` — first formal spec for this behavior).

## Impact

- Keycloak admin console configuration for the `clientA` realm/client (infrastructure change, not a code diff — tracked here as a task with explicit settings to apply).
- `README.md` — Keycloak setup instructions.
- `api/src/interfaces/adapters/authAdapters.ts` — refresh-failure logging only; the cookie/maxAge plumbing itself is already correct and needs no code change.
- No frontend changes expected — `useAuth.ts`/`customFetch.ts`'s refresh flow already does the right thing once Keycloak issues a longer-lived refresh token.
