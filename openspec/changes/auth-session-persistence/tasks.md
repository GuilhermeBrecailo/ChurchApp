## 1. Keycloak configuration

- [x] 1.1 Inspect `appchurch` realm's current session settings via Keycloak Admin REST API (`GET /admin/realms/appchurch`) — confirmed `ssoSessionIdleTimeout: 1800` (30 min), `ssoSessionMaxLifespan: 36000` (10h), root cause of the reported bug
- [x] 1.2 Set "SSO Session Idle" to 7 days (604800s) via `PUT /admin/realms/appchurch`
- [x] 1.3 Set "SSO Session Max" to 7 days (604800s), same request
- [ ] 1.4 Repeat for staging/production environments (local docker-compose Keycloak done; staging/prod need the same change applied by whoever administers those Keycloak instances — out of reach from this session)

## 2. Backend

- [x] 2.1 Structured logging of Keycloak error status/body on refresh failure — already present in `authAdapters.ts`'s `refreshToken` handler (`event: "auth.refresh.failure"` with `keycloakStatus`/`keycloakBody`), predates this change; confirmed sufficient, no edit needed

## 3. Documentation

- [x] 3.1 Added step 8 to `README.md`'s "Configurar Keycloak" section documenting the SSO Session Idle/Max = 604800s requirement and why (Keycloak's own default idle timeout was silently capping sessions well under the app's 7-day expectation)

## 4. Verification

- [x] 4.1 Confirmed via raw `Set-Cookie` header on a real login (`curl -D -`): `refresh_token=...; Max-Age=604800`
- [x] 4.2 Confirmed refresh succeeds using the saved cookie (`GET /public/auth/refresh-token` → 200, new `refresh_expires_in: 604800`)
- [x] 4.3 Confirmed logout still fully invalidates: post-logout refresh attempt → 403 "Refresh token nao encontrado"
- [x] 4.4 Cross-domain production cookie behavior (`SameSite=None`, `Domain=.appcunch.shop`) unaffected by inspection — this change only touched Keycloak realm session timeouts, no cookie-setting code in `authAdapters.ts` was modified; local dev correctly still uses `SameSite=Lax` since `NODE_ENV !== "production"`
