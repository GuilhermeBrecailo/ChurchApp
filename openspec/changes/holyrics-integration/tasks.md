## 1. Verify the real Holyrics API (done for the docs; still needs a live test)

- [x] 1.1 Read the actual `holyrics/API-Server` README + `holyrics/Scripts/ApiPopupCreateSong.md` in full (not a search summary) — auth model, `SearchLyrics`/`GetSongs`/`AddLyricsToPlaylist`/`popup-createsong` all confirmed; findings folded into `design.md` (2026-09-25)
- [x] 1.2 Confirmed `AddLyricsToPlaylist` takes existing song IDs only (single `id` or batch `ids`), no raw lyrics/chords text accepted — scope corrected in `proposal.md`/`design.md`
- [ ] 1.3 **Still needed before building**: a real (or trial) Holyrics install with "internet access" enabled, to do one manual `SearchLyrics` → `AddLyricsToPlaylist` call end-to-end and confirm match quality/response shape against actual data, not just docs
- [ ] 1.4 Confirm rate-limit behavior on `api.holyrics.com.br` empirically if possible (undocumented)

## 2. Database

- [ ] 2.1 Add `holyricsToken String?` and `holyricsPlaylistName String?` to `Crunch` in `schema.prisma`
- [ ] 2.2 Prisma migration

## 3. Backend

- [ ] 3.1 `api/src/interfaces/adapters/holyricsAdapters.ts` — direct-adapter pattern: `status`, `connect` (save + validate token against Holyrics), `disconnect`, `syncSchedule(scheduleId)`
- [ ] 3.2 `api/src/interfaces/routes/HolyricsRoutes.ts` mirroring `WhatsAppRoutes.ts` (`GET /api/church/holyrics/status`, `POST /api/church/holyrics/connect`, `POST /api/church/holyrics/disconnect`, `POST /api/church/holyrics/schedules/:id/sync`), registered in `server.ts`
- [ ] 3.3 `syncSchedule`: for each `Schedule.mediaItems` (ordered by `ScheduleMediaItem.order`), call `SearchLyrics` with `title`/`metadata.artist`; on a match, collect its Holyrics `id`; call `AddLyricsToPlaylist` once with the batched `ids` (in escala order); return `{ added: [...], notFound: [...] }` so the caller knows exactly what happened
- [ ] 3.4 Error handling: Holyrics call failures return a clear `DomainError` (bad/missing token, Holyrics unreachable, per the app's existing `controllerHandler` contract) — never a 500 that looks like a ChurchApp bug. A partial match (some songs found, some not) is a **success** response with a `notFound` list, not an error.
- [ ] 3.5 `crunchId`-scoped like every other tenant query — confirm `TenantHandler` context is used, no cross-church leakage of tokens

## 4. Frontend

- [ ] 4.1 Church settings: "Integrações" section (new or extended) with token/playlist-name fields, connect/disconnect actions, status indicator — new `useHolyrics.ts` composable, following the `useAuth.ts`/`useChurch.ts` pattern (only place that calls the API)
- [ ] 4.2 Escala repertoire view: "Montar playlist no Holyrics" button, hidden when the church has no token configured; result view must list which songs were added and which weren't found (not just a generic success toast)
- [ ] 4.3 Link to Holyrics' own "enable internet access / generate token" instructions from the settings field, given the setup happens outside ChurchApp

## 5. Docs

- [ ] 5.1 README or `docs/` note on the Holyrics integration: what it does, its manual/opt-in nature, and the token-storage caveat from `design.md`

## 6. Verification

- [ ] 6.1 Connect flow: valid token → status shows connected; invalid token → clear error, nothing saved
- [ ] 6.2 Sync flow against a real (or test) Holyrics instance: escala with songs already registered in Holyrics → playlist appears correctly, order preserved; escala with a mix of registered/unregistered songs → matched ones added, unmatched ones reported, nothing silently dropped
- [ ] 6.3 Sync with no token configured: button hidden/disabled, no route reachable without one
- [ ] 6.4 Sync failure (revoke token, or point at an unreachable host): ChurchApp shows a clear error, escala data itself untouched
- [ ] 6.5 `npm run validate` (lint + typecheck + test + web build) green
