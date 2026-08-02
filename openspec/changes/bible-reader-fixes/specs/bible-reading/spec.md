## ADDED Requirements

### Requirement: Chapter content matches the requested version
The system SHALL serve chapter text for the exact translation version the member selected, or SHALL explicitly mark the response as a fallback to a different version when the requested one is unavailable. The system SHALL NOT render substituted content under the originally-selected version's label.

#### Scenario: Requested version is available
- **WHEN** a member selects a version (NVI, ACF, ARA, or NVT) and a book/chapter that has cached or fetchable content for that version
- **THEN** the reader displays that version's text and the version chip shows the requested version, unmarked as fallback

#### Scenario: Requested version is unavailable
- **WHEN** a member selects a version and the configured providers cannot return that version's text for the requested chapter
- **THEN** the reader either serves a different version and visibly marks it as a fallback (chip + alert stating which version is actually shown), or shows an explicit "unavailable" error — it never silently renders substituted text under the requested version's chip

#### Scenario: All providers unavailable for a chapter with no cache
- **WHEN** no third-party provider can be reached and the requested chapter has never been successfully cached
- **THEN** the reader shows an explicit retry-able error state instead of blank or incorrect content

### Requirement: Chapter content is cached after first successful fetch
The system SHALL persist successfully fetched chapter text (per version, book, and chapter) server-side so that subsequent requests for the same combination do not require a live third-party fetch.

#### Scenario: Repeat request for a previously fetched chapter
- **WHEN** a member requests a `(version, book, chapter)` combination that was already successfully fetched and cached
- **THEN** the system returns the cached text without calling any third-party provider

### Requirement: Unavailable versions are disabled in the selector, not silently swapped
The system SHALL indicate, in the version selector, which versions currently have no working provider, and SHALL prevent selecting a version that is known to be unavailable rather than accepting the selection and silently serving different content.

#### Scenario: A version's provider is confirmed down
- **WHEN** the system has determined that a given version has no working provider (e.g. via a recent failed fetch or an availability check)
- **THEN** that version's option in the `Versão` selector is disabled or visibly flagged as unavailable
