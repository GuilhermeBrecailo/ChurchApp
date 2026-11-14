## Context

Repertoire data already exists and is already structured the way this needs it:
- `MediaItem` (`title`, `url`, `category`, `metadata` Json) holds each song; `metadata` already carries `artist`, `key`, `bpm`, `lyrics`, `chords`, `keyboardChords`, `notes` for songs imported from Cifra Club (`CifraClubSongImport` type in `churchDepartment/types.ts`) and presumably a compatible shape for manually-entered songs.
- `Schedule` (an escala) links to its ordered repertoire via `ScheduleMediaItem` (`scheduleId`, `mediaItemId`, `order`) — this is the exact same "playlist for this culto" the existing `presentation-mode` feature already swipes through.

**Verified against the actual `holyrics/API-Server` and `holyrics/Scripts` repos (2026-09-25) — this supersedes the search-summary assumptions the first draft of this proposal was based on:**

- Auth: each Holyrics installation generates its own `API_KEY` (Settings → API Server) and per-permission `token` (Settings → API Server → Manage permissions) — no third-party/developer registration with Holyrics needed. Remote calls: `POST https://api.holyrics.com.br/send/{action}` (fire-and-forget) or `/request/{action}` (waits for response), headers `api_key` + `token`, JSON body with the action's parameters. Response envelope: `{ status, response_status, response }`; errors come back as `{ status: "error", error: { code, key, message } }`.
- `SearchLyrics` (params: `text`, plus boolean scope flags `title`/`artist`/`note`/`lyrics`) and `GetSongs` both query the church's own Holyrics song library and return `{ id, title, artist, author, note, key, bpm, time_sig, groups, archived }[]` — this is how we find the Holyrics-internal ID for a song ChurchApp already knows by title/artist.
- `AddLyricsToPlaylist` takes `id` (single) or `ids` (array) of **existing** Holyrics lyrics IDs, plus `index` (insertion position) and `media_playlist` (bool). It does not accept raw lyrics/chords text — it only places already-registered songs into the playlist.
- The one action that *creates* a song (`popup-createsong`, `POST http://localhost:8091/api/popup-createsong`, takes `title`/`lyrics`/`artist`/`key`/`bpm`/etc. as raw text) explicitly **only accepts requests from `127.0.0.1`** — unreachable from ChurchApp's servers even via the official cloud relay, and even locally it just opens a pre-filled editor popup for a human to confirm, not a silent save.

**Consequence for scope**: the sync this change can honestly deliver is "for each song in this escala, find it in the church's existing Holyrics library by title/artist and add it to today's playlist" — not "push this song's lyrics/chords into Holyrics." A song ChurchApp knows about but that was never registered in Holyrics will not be found by `SearchLyrics` and cannot be created remotely; the sync must report it as unmatched rather than silently skip or fail the whole batch.

## Goals / Non-Goals

**Goals:**
- A church that already has Holyrics configured (internet access on, token generated) can, from an escala's repertoire screen, auto-build that culto's Holyrics playlist in one action, for whichever songs are already registered in their Holyrics library — no manual search-and-drag per song.
- The sync clearly reports which songs matched (added) and which didn't (need registering in Holyrics manually) — never a silent partial result.
- The integration is entirely opt-in and inert for churches that don't use Holyrics: no schema requirement, no UI shown, unless a token is set.
- Failure of the Holyrics call (bad token, Holyrics offline, network) degrades gracefully — the escala/repertoire in ChurchApp is unaffected either way; this is a one-way, best-effort push, not a dependency.

**Non-Goals (this iteration):**
- Creating/importing new song lyrics or chords into Holyrics — not possible remotely (see Context); a song must already exist in the church's Holyrics library to be matched.
- A local agent/companion app on the church's PC to unlock true "zero re-typing" (the `popup-createsong` localhost-only path) — real candidate for a future change if this lighter version proves valuable, deliberately out of scope here given the much larger engineering/support surface (installer, keeping a local process alive, non-technical church admins configuring it).
- Two-way sync or reading anything back from Holyrics (e.g. confirming what's currently projected).
- Pushing avisos, the daily verse, or prayer requests via Holyrics' `SetAlert`/communication-panel actions — real candidates for later, deliberately excluded here to keep this change reviewable.
- Replacing or modifying `presentation-mode` ("Modo Telão") — that stays the in-app projection option for churches without Holyrics; this change is additive for churches that already standardized on Holyrics.
- Auto-sync on schedule changes (e.g. re-sync when a song is added after the first push). MVP is an explicit, manual "Montar playlist no Holyrics" button the operator presses before the culto.

## Decisions

- **Use Holyrics' official cloud relay (`api.holyrics.com.br`), not a local agent — and accept the reduced scope this implies (match-existing, not create-new).** Alternative considered: a local companion app/websocket bridge on the church's PC (the approach another church-management project took, per public GitHub history), which would unlock the `popup-createsong` localhost endpoint and true zero-re-typing — rejected for this iteration because it requires the church to install and keep running a second piece of software; worth revisiting as a distinct future change if the lighter version proves valuable.
- **Match-by-name with explicit unmatched reporting**, not a silent best-effort — since the API can't create missing songs, the sync must tell the operator exactly which songs weren't found so they know to register those in Holyrics themselves (rather than discover a gap only during the culto).
- **Direct-adapter pattern**, not the full clean-architecture path — this is a new, self-contained feature (matches `CLAUDE.md`'s guidance that newer features route → `*Adapters` → Prisma directly).
- **Token stored per-church on `Crunch`**, not a separate table — mirrors `accentColor`/`fontFamily`; there's exactly one Holyrics connection per church, no history/multiplicity to model.
- **Manual trigger only (button), no background sync** for this iteration — smaller surface area, and avoids silently calling an external API on a cron for churches that may have stale/misconfigured tokens.

## Risks / Trade-offs

- [Match-by-title/artist is fuzzy] → `SearchLyrics` is a text search, not an exact-ID lookup; a church with multiple versions of the same song title (different arrangements/keys) could get a wrong or ambiguous match. MVP: surface the matched title/artist back to the operator before/after adding, so a wrong match is obvious and correctable in Holyrics directly, not silently trusted.
- [Value proposition is smaller than originally scoped] → This only saves "find and drag songs into the playlist," not "type the song into Holyrics at all." Worth validating with a real church/beta user that this is still worth building before investing in the local-agent version (non-goal above).
- [Dependency on a third-party cloud relay outside ChurchApp's control] → Scoped as best-effort/fire-and-forget with clear UI feedback on failure; never blocks the core escala/repertoire flow.
- [Church must correctly enable "internet access" + generate a token inside Holyrics itself] → This is a real support burden (non-technical church admins configuring a third-party app's settings). Out of scope to solve fully here, but the connect flow should surface a clear error (not a silent 401) so it's diagnosable, and the settings UI should link to Holyrics' own instructions.
- [Token stored in plaintext on `Crunch` for the MVP] → Acceptable short-term given it's scoped to a single external write action (no read access to church data), but flagged as a follow-up: encrypt at rest or move to a secrets-capable store if this integration expands.

## Migration Plan

1. Confirm the real Holyrics API auth/endpoint shape (Task 1) — this can change the design above; revisit Decisions if the assumptions don't hold.
2. Add `holyricsToken`/`holyricsPlaylistName` to `Crunch` via Prisma migration.
3. Backend: `HolyricsRoutes.ts` + `holyricsAdapters.ts` (status/connect/disconnect/sync).
4. Frontend: settings field + escala "Enviar para o Holyrics" button.
5. Manual verification against a real Holyrics install (see tasks.md).
6. Rollback: the new fields are nullable and the feature is additive — disabling is just hiding the button/route if the integration turns out unreliable; no data migration to undo.

## Open Questions

- Resolved (2026-09-25): no app-level registration needed — each church self-serves both `api_key` and `token` from their own Holyrics install. `AddLyricsToPlaylist` accepts a batch (`ids` array). It does not take lyrics/chords text — only references existing song IDs (see Context).
- Still open: rate limits on `api.holyrics.com.br` — not documented; relevant if many churches sync around the same Sunday-morning window. Low risk given this is a manual, one-button-per-escala action, not a cron, but worth a quick check with Holyrics if this ships broadly.
- Still open: `SearchLyrics`'s text-match quality/ranking when a church has near-duplicate titles — needs hands-on testing against a real Holyrics library, not just the docs.
