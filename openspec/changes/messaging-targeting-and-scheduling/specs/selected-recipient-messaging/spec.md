## ADDED Requirements

### Requirement: Roster picker for manual sends
The system SHALL let a pastor/admin browse and multi-select individual roster members (mixing `VISITOR` and `MEMBER` status freely) from within the "Enviar agora" flow, as an alternative to picking a status-bucket audience.

#### Scenario: Picker shows the church's active roster
- **WHEN** a pastor opens the recipient picker in "Enviar agora"
- **THEN** the system shows every `VISITOR`/`MEMBER` roster member of their church, searchable by name, with checkboxes to select any combination

#### Scenario: Selection persists until send or cancel
- **WHEN** a pastor selects several roster members and then changes the template
- **THEN** the system keeps the selected recipients unchanged, letting the pastor change template/message without losing their picks

#### Scenario: Empty selection cannot be sent
- **WHEN** a pastor chooses the "Selecionar pessoas" audience mode but selects zero recipients and attempts to send
- **THEN** the system blocks the send with a clear message instead of silently sending to nobody
