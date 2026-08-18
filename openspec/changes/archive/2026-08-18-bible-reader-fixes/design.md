## Context

`useBible.ts` fetches directly from the browser to two free third-party APIs, in order:
1. `abibliadigital.com.br/api/verses/:version/:book/:chapter` — supports `nvi`, `acf`, `ra`, `nvt` (the four options in `BIBLE_VERSIONS`). Currently returning connection-level errors (`NR_CLOSED`), confirmed via direct `curl` — not a transient 500, the upstream is down at the network layer for at least the primary hostname.
2. `bible-api.com/:book+:chapter?translation=almeida` — only Almeida, used unconditionally as the catch-all fallback regardless of which version the member picked.

Two independent bugs compound: (a) provider #1 being down means 100% of requests silently degrade to a translation the user didn't choose, and (b) at least one book abbreviation (`jó` for Job, sent through `encodeURIComponent`) is non-ASCII and passed straight into provider #1's path — worth confirming against their actual abbreviation table once #1 is back up, since it's a plausible second, independent cause of per-book failures.

Chapter content itself is public-domain/permissively-licensed scripture text — cacheable indefinitely per `(version, book, chapter)` triple once fetched successfully.

## Goals / Non-Goals

**Goals:**
- A member who selects a version either reads that version, or is clearly told upfront (before rendering, not after a silent swap) that it isn't available right now — never an unlabeled substitution.
- Reduce live dependency on any single third-party host for repeat reads of the same chapter.
- Survive one provider being fully down without the feature looking broken.

**Non-Goals:**
- Licensing/bundling full Bible text datasets into the repo (copyright constraints on NVI/NVT/ACF text vary by publisher — out of scope for this change; revisit only if third-party APIs remain unreliable long-term).
- Offline/PWA reading mode.
- Adding more translations beyond the current four.

## Decisions

- **Add a Postgres-backed cache table (`BibleChapterCache` via Prisma), read/write from a new API route** (`GET /api/bible/:version/:book/:chapter`), instead of fetching third-party APIs directly from the browser.
  - Why: centralizes retry/fallback logic server-side (one place to fix instead of duplicating in the client), and turns every successful fetch into a permanent cache hit for all members/churches thereafter — chapter text doesn't change. Follows the existing direct-adapter route pattern (`interfaces/routes/` → `*Adapters` → Prisma) already used for devotionals/daily-verse, so it fits the codebase's established newer-feature pattern rather than introducing a third one.
  - Alternative considered: keep client-side fetching, just fix the fallback bug in `useBible.ts`. Rejected — doesn't solve the "provider #1 fully down" case, every member would independently retry a dead host on every chapter view.
- **Version-aware fallback order**: for a requested `(version, book, chapter)`, try provider #1 with that version; on failure, try provider #1 with a version known to overlap in translation family (none currently — the four versions are distinct), then fall back to provider #2's Almeida text **only while explicitly flagging** `requestedVersion !== servedVersion` in the response payload. The frontend already has `usedFallback`; this just makes the signal authoritative from the server instead of inferred client-side.
- **Disable selector options with no working provider** rather than letting the user pick a version that will silently become something else. `bible.vue`'s `v-select` for `Versão` gets a per-item `disabled` bound to a `versionAvailability` map returned alongside chapter data (or fetched once on mount via a lightweight `GET /api/bible/availability`).
- **Fix the Job abbreviation**: map `jó` → provider-specific abbreviation explicitly in a new server-side book-abbreviation table per provider, instead of reusing `BIBLE_BOOKS[].abbrev` (the internal/display abbreviation) as the wire format for both providers. Verify against provider #1's real abbreviation list once it's reachable again (task, not blocking the rest of this change).

## Risks / Trade-offs

- [Both third-party providers go down simultaneously] → Cache already covers any chapter previously read by any member of any church; cold chapters return a clear "indisponível, tente novamente" error instead of wrong content — this is a real product limitation, not silently hidden.
- [Cache table grows unbounded] → Bounded by definition: 4 versions × 66 books × ≤176 chapters (Psalms) each ≈ low tens of thousands of rows max, trivial for Postgres.
- [Server-side proxy adds latency vs. direct client fetch for cache misses] → Acceptable; cache hits (expected majority after warm-up) are faster than the current always-live-fetch behavior.

## Migration Plan

1. Add `BibleChapterCache` Prisma model + migration (no data migration needed, table starts empty).
2. Ship the new `/api/bible/*` route and adapter with the provider/fallback/cache logic.
3. Switch `useBible.ts` to call the new internal route instead of the two third-party hosts directly.
4. Roll out `versionAvailability`-driven selector disabling.
5. Rollback: revert `useBible.ts` to direct third-party calls (previous behavior) if the new route misbehaves — no data loss since the cache table is additive only.

## Open Questions

- Does `abibliadigital.com.br` support any additional translations beyond the current four that could serve as a same-quality fallback for a version it can't serve (rather than falling all the way to Almeida)? Needs checking once the host is reachable again.
- Confirm provider #1's real book-abbreviation list for Job (and any other accented-abbreviation books) once reachable.
