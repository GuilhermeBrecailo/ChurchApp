## ADDED Requirements

### Requirement: Non-root screens have a back or close control
Every screen reachable by navigating away from a bottom-nav tab root SHALL present an explicit back or close control, rather than relying solely on the browser's native back button.

#### Scenario: Visiting a secondary flow screen
- **WHEN** a user navigates to `register`, `onboarding/church`, `forgot-password`, `content/devotionals`, `content/verse`, or `content/index`
- **THEN** the screen shows a back control that returns to the previous screen

#### Scenario: Visiting a bottom-nav tab root
- **WHEN** a user is on a bottom-nav tab root screen (e.g. the home feed, escalas, ministérios, notifications, settings)
- **THEN** no back control is required, since these are navigation roots

### Requirement: Data-loading screens show a loading state
Every screen that fetches data before it can render its primary content SHALL show a skeleton or spinner while that fetch is in flight, never a blank screen.

#### Scenario: Screen with a pending fetch
- **WHEN** a screen's initial data fetch has not yet resolved
- **THEN** the screen shows a loading indicator shaped like the eventual content, not a blank page

### Requirement: Secondary content expands via the shared overlay component
Expandable secondary content (detail panels, preference panels, and similar) SHALL use the shared responsive overlay component, presented as a bottom sheet on mobile and a dialog/fullscreen view on desktop, rather than inline native disclosure elements or ad-hoc inline expansion.

#### Scenario: Opening a secondary detail panel
- **WHEN** a user opens a secondary detail panel (e.g. a song's chord preference settings) from a screen
- **THEN** it opens using the shared responsive overlay component, consistent with how other dialogs/sheets in the app behave
