## ADDED Requirements

### Requirement: Song list cards show only scan-essential information
The system SHALL display, per song in a repertoire list, only the title, artist, and a single compact content-availability indicator. All other song details (notes, PDF link, embedded media, key, BPM, full lyrics/chords) SHALL be reachable only by opening the song, not shown inline in the list.

#### Scenario: Viewing a repertoire with several songs
- **WHEN** a member views a ministry's song repertoire list
- **THEN** each card shows title, artist, and one compact indicator, with no notes, embed player, or multiple separate content chips shown inline

#### Scenario: Opening a song
- **WHEN** a member taps a song card
- **THEN** a detail/reader view opens showing the full information: key, BPM, category, notes, PDF link, embedded media, and lyrics/chords with transposition controls

### Requirement: Manage actions live in the song detail view, not the list
The system SHALL present edit and delete actions for a song only within that song's detail/reader view for users with manage permission, not as inline icon buttons on every list card.

#### Scenario: Leader wants to edit a song
- **WHEN** a leader with manage permission opens a song's detail view
- **THEN** edit and delete actions are available there
- **AND** the song's list card itself shows no edit/delete icon buttons

### Requirement: Song list is searchable and filterable by category
The system SHALL allow filtering the visible song list by a text search across title/artist and by category.

#### Scenario: Searching the repertoire
- **WHEN** a member types a query matching a song's title or artist
- **THEN** only matching songs remain visible in the list

#### Scenario: Filtering by category
- **WHEN** a member selects a category filter
- **THEN** only songs in that category remain visible in the list

### Requirement: One shared song card and reader component across screens
The system SHALL use the same song list-card and detail/reader components wherever a song list appears (ministry repertoire tab and schedule details), rather than maintaining separate implementations per screen.

#### Scenario: Song reader behavior in a schedule's details
- **WHEN** a member opens a song from a schedule's details sheet
- **THEN** the reader shown (including transposition and auto-scroll controls) is the same component used in the ministry repertoire tab
