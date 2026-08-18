## ADDED Requirements

### Requirement: Ministry detail tabs are independently maintainable components
The system SHALL implement each ministry detail tab (Visão geral, Líder, Escalas, Tarefas, Recursos, Músicas, Aulas) as its own component, including the dialogs specific to that tab, rather than a single file containing all tabs and all dialogs.

#### Scenario: Viewing any ministry tab
- **WHEN** a user opens any tab on a ministry's detail page
- **THEN** that tab's content and its own create/edit dialogs render correctly, sourced from that tab's dedicated component

### Requirement: Ministry schedule tab is a summary linking to the canonical schedule screen
The system SHALL present the ministry detail page's "Escalas" tab as a read-only summary of upcoming schedules for that ministry, with a control that navigates to the main schedule screen filtered to that ministry for full create/edit/manage actions.

#### Scenario: Viewing upcoming schedules from a ministry page
- **WHEN** a leader opens the "Escalas" tab on a ministry's detail page
- **THEN** they see a summary of upcoming schedules for that ministry and a control to view/manage all of them on the main schedule screen

#### Scenario: Managing a schedule
- **WHEN** a leader wants to create or edit a schedule
- **THEN** they do so on the main schedule screen (`/scale`), not via a separate duplicate form on the ministry detail page

### Requirement: Ministry repertoire and resources reuse shared components
The system SHALL use the shared song card/viewer components and the shared resource dialog (with PDF upload) on the ministry detail page's "Músicas" and "Recursos" tabs, rather than maintaining ministry-page-local implementations of either.

#### Scenario: Viewing the repertoire from a ministry page
- **WHEN** a member opens the "Músicas" tab
- **THEN** the song list and detail behavior match the shared music-repertoire components used elsewhere in the app
