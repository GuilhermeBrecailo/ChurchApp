## ADDED Requirements

### Requirement: Church opts into a Holyrics connection
The system SHALL allow a church admin to store a Holyrics access token for their church, and SHALL treat the integration as disabled/hidden for any church that has not configured one.

#### Scenario: Configuring a token
- **WHEN** a church admin enters a valid Holyrics token in church settings and saves it
- **THEN** the church's connection status shows as connected and the "Enviar para o Holyrics" action becomes available on escala repertoire views

#### Scenario: No token configured
- **WHEN** a church has never configured a Holyrics token
- **THEN** no Holyrics-related action is shown on escala repertoire views, and the sync endpoint rejects requests for that church

#### Scenario: Disconnecting
- **WHEN** a church admin disconnects the Holyrics integration
- **THEN** the stored token is cleared and the church returns to the "not configured" state

### Requirement: Escala repertoire builds a Holyrics playlist from matching songs
The system SHALL let a user with access to an escala build that culto's Holyrics playlist from the escala's ordered repertoire, matching each song against the church's existing Holyrics song library by title/artist, without altering the escala or its songs in ChurchApp and without creating new songs in Holyrics.

#### Scenario: All songs matched
- **WHEN** a user presses "Montar playlist no Holyrics" on an escala whose every song is already registered in the church's Holyrics library, and the church has a valid Holyrics connection
- **THEN** all songs are added to the Holyrics playlist in the escala's order, and the user sees a success confirmation listing what was added

#### Scenario: Some songs not found in Holyrics
- **WHEN** the sync action is triggered on an escala where one or more songs have no match in the church's Holyrics library
- **THEN** the matched songs are added to the Holyrics playlist, and the user is shown exactly which songs were not found so they can register those in Holyrics themselves — this is reported as a partial success, not a silent drop or a hard failure

#### Scenario: Holyrics unreachable or token invalid
- **WHEN** the sync action is triggered but the Holyrics API call fails (network error, invalid/revoked token, Holyrics API error)
- **THEN** the user sees a clear error describing the sync failed, the escala's own data in ChurchApp is unchanged, and no partial/silent success is reported

#### Scenario: Empty repertoire
- **WHEN** the sync action is triggered on an escala with no songs attached
- **THEN** the system does not call Holyrics and informs the user there is nothing to send
