## ADDED Requirements

### Requirement: Any member can view their church's basic info
The system SHALL provide a read-only view of the active church's basic information (name, logo, address, service times) accessible to any authenticated member, regardless of manage permissions.

#### Scenario: Regular member views church info
- **WHEN** a member without manage permissions opens the "Dados da Igreja" section from settings
- **THEN** they see the church's name, logo, address, and service times in read-only form

#### Scenario: Manager views the same info
- **WHEN** a user with manage permissions (pastor/admin) opens "Dados da Igreja"
- **THEN** they see the same read-only info, with editing still only available via the existing Admin → Geral screen

### Requirement: Public page is linkable from within the app
The system SHALL present a "Ver página pública" control that opens the church's public landing page (`/c/:slug`), available both to managers editing church data and to any member viewing the read-only church info.

#### Scenario: Manager opens the public page from admin
- **WHEN** a manager on the Admin → Geral screen clicks "Ver página pública"
- **THEN** the church's public landing page opens in a new tab

#### Scenario: Member opens the public page to share with a visitor
- **WHEN** a member viewing "Dados da Igreja" clicks "Ver página pública"
- **THEN** the same public landing page opens, so they can share the link with someone outside the church
