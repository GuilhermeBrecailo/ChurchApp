## ADDED Requirements

### Requirement: Volunteer assignment requires ministry selection first
The system SHALL only allow adding volunteers to a new or edited schedule after a ministério (department) has been selected for that schedule. Until a ministério is selected, the volunteer-adding controls SHALL be visibly present but disabled, with an explanatory hint.

#### Scenario: No ministério selected yet
- **WHEN** a leader opens "Nova escala" and has not yet chosen a value in the "Ministério" field
- **THEN** the "Voluntários" section's add-volunteer control is disabled and shows a hint to select a ministério first

#### Scenario: Ministério selected
- **WHEN** a leader selects a ministério in the schedule form
- **THEN** the "Voluntários" section becomes enabled and role suggestions reflect that ministério's `departmentRoleOptions`

#### Scenario: Editing an existing schedule
- **WHEN** a leader opens "Editar escala" for a schedule that already has a ministério set
- **THEN** the "Voluntários" section is enabled immediately, with role suggestions from that schedule's ministério

### Requirement: Single-ministry leaders default straight to volunteer entry
The system SHALL pre-select the ministério field when the acting leader manages exactly one ministério, so the volunteer-adding flow is not gated by an extra manual step for the common single-ministry case.

#### Scenario: Leader manages exactly one ministério
- **WHEN** a leader who manages only one ministério opens "Nova escala"
- **THEN** that ministério is pre-selected and the "Voluntários" section is enabled immediately
