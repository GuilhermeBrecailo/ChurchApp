## Context

Token flow today (all already implemented, confirmed by reading the code):
1. `POST /public/auth/login` → Keycloak issues `access_token` + `refresh_token`, backend sets `refresh_token` as an httpOnly cookie with `Max-Age = token.refresh_expires_in` (`authAdapters.ts:292`).
2. Access token lives client-side only in `useState("access_token")` — reset on every fresh navigation/reload by design (this is the documented in-memory pattern from `CLAUDE.md`'s Auth flow section, not a bug).
3. `customFetch.ts`'s `refreshAccessToken()` calls `POST /public/auth/refresh-token` with `credentials: "include"` whenever the access token is missing or near expiry (`shouldRefresh()`), reads the new `access_token` from the response, and re-derives session state.
4. `auth.global.ts` middleware triggers this refresh on every route entry that needs auth, and only redirects to `/login` if the refresh genuinely fails.

None of this depends on `Max-Age` being any particular value — it's fully driven by `refresh_expires_in`, which Keycloak controls. The demo-login code path hardcodes `604800` (7 days) specifically because there's no Keycloak realm behind the demo user to source a real value from — that hardcoded number is effectively a spec for what the real client should also deliver.

## Goals / Non-Goals

**Goals:**
- A member who logs in and returns within 7 days of their last activity does not see `/login` again.
- The fix lives in configuration (Keycloak), not a workaround bolted onto the app's token logic, since the app's token logic is already correct.

**Non-Goals:**
- Switching to a different token-storage strategy (e.g. persisting the access token itself in `localStorage`) — the current in-memory-token + httpOnly-refresh-cookie split is a deliberate security choice (XSS can't steal a long-lived credential from `useState`) and shouldn't be undone to work around a Keycloak config gap.
- Changing Keycloak's access-token lifetime (short-lived access tokens are fine and expected; only the refresh token's effective lifetime needs to reach 7 days).

## Decisions

- **Fix at the Keycloak client/realm level**: set `clientA`'s "Client Session Idle" and "Client Session Max" (or, if those aren't overridden per-client, the realm's "SSO Session Idle"/"SSO Session Max") to 7 days. This is the layer that actually determines `refresh_expires_in` in the token response the backend already forwards correctly.
  - Alternative considered: have the backend request Keycloak's "offline_access" scope and use offline tokens (which don't expire on idle timeout, only on explicit revocation or a much longer absolute max). Rejected for now — bigger change to the OAuth flow and token semantics than the ask calls for; revisit only if 7 days via session-idle config turns out to be insufient in practice (e.g. if product later wants "stay logged in indefinitely").
  - Alternative considered: silently extend `Max-Age` in the cookie-setting code beyond what Keycloak actually issued. Rejected — the cookie would outlive the token it stores; Keycloak would still reject the stale refresh token, so this fixes nothing, it would just delay when the failure becomes visible.
- **Log refresh failures server-side** (`authAdapters.ts`'s refresh-token handler) with the Keycloak error body/status, so a genuinely-expired-per-policy logout is distinguishable from a misconfiguration during rollout of this change.

## Risks / Trade-offs

- [Keycloak realm/client config is manual, no config-as-code in this repo] → Document the exact settings and values in the README's existing Keycloak section so the next environment (staging/prod, or a fresh local setup) doesn't regress; consider a follow-up change to add a realm-export JSON if this keeps needing to be redone (explicitly out of scope here).
- [Extending SSO session lifetime is a security/UX trade-off, not free] → 7 days matches what the user explicitly asked for and what the demo login already models; if a future compliance requirement needs shorter sessions for certain roles (e.g. `SUPER_ADMIN`), that would be a separate, more granular change.

## Migration Plan

1. Apply the Keycloak client/realm session settings in the target environment's admin console.
2. Add the refresh-failure logging to `authAdapters.ts`.
3. Update `README.md`'s Keycloak setup section with the exact settings.
4. Verify: log in, wait past the *old* short timeout (or manipulate Keycloak's session admin view to confirm the new idle/max values are active), confirm a return visit does not redirect to `/login`.
5. Rollback: revert the Keycloak client/realm settings to their previous values if this causes unexpected session-management issues; no app code changes to roll back beyond the added logging.

## Open Questions

- What are the current `clientA` session settings? Needs checking directly in each environment's Keycloak admin console (dev/staging/prod may differ) before applying the change — not visible in this repo since there's no realm-export file.
