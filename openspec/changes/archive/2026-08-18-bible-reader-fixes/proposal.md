## Why

The Bible reader (`web/app/pages/content/bible.vue`, `web/composables/useBible.ts`) sources chapter text from a single primary provider, `abibliadigital.com.br`. That provider is currently unreachable (connection-level failure, not a normal HTTP error), so **every** chapter request falls through to the secondary provider, `bible-api.com`, which only serves the Almeida translation. The result: a member who picks NVI, ACF, ARA, or NVT always reads Almeida text instead — the version selector is effectively decorative right now. There is a fallback warning chip/alert already in the UI, but members read it as "the Bible feature shows the wrong content," not as an informed choice.

## What Changes

- Stop depending on a single flaky free-tier provider for the primary reading path. Introduce a provider abstraction with real per-version fallback ordering (not "any version → Almeida"), so an NVI request that fails tries another source that actually has NVI before falling back to a different translation.
- Fix book-abbreviation mismatches between the two providers (e.g. `jó` used as the primary-provider path segment for Job, where accented/non-ASCII abbreviations are a likely source of silent per-book failures independent of the outage).
- Make the "you're not reading the version you picked" state impossible to miss: block a stale chapter from rendering under the originally-selected version's chip, and disable/relabel unavailable versions in the `Versão` selector instead of silently swapping content after fetch.
- Add a lightweight server-side cache/proxy for chapter responses (API route in `api/`) so the app isn't fully load-bearing on third-party uptime for every chapter view, and so book/version/chapter combinations that are known-good don't re-hit a possibly-down provider on every navigation.
- Add automated coverage asserting that a chapter fetched under a given `selectedVersion` either renders that version's text or explicitly marks the content as a fallback — never silently.

## Capabilities

### New Capabilities
- `bible-reading`: reliable Bible chapter retrieval with real multi-provider fallback, version-integrity guarantees, and caching. (`openspec/specs/` has no existing entry for this even though the feature shipped under the earlier `bible-reader` change — this proposal is the first to formalize the spec.)

### Modified Capabilities
- none (no other synced capability spec currently covers Bible content)

## Impact

- `web/composables/useBible.ts` — fetch/fallback logic, provider abstraction, book-abbreviation mapping.
- `web/app/pages/content/bible.vue` — version-selector availability state, fallback messaging.
- `api/` — new thin proxy/cache route for Bible chapters (new route file under `interfaces/routes/`, adapter under `interfaces/adapters/`, following the existing direct-adapter pattern used by `devotionalAdapters.ts`).
- No schema/DB changes expected unless caching is implemented via Postgres instead of in-memory/Redis-less cache — to be decided in design.md.
